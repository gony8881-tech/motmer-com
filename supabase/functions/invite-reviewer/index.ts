import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // 1. التعامل مع طلبات Preflight CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 2. التحقق من مفاتيح البيئة السريّة للـ Edge Function
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "متغيرات البيئة الخاصة بـ Supabase غير مهيأة في الـ Edge Function.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. قراءة جسم الطلب
    const body = await req.json().catch(() => ({}));
    const reviewerId = body.reviewerId;

    if (!reviewerId) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "معرّف المحكّم (reviewerId) مطلوب.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 4. إنشاء عميل Supabase بصلاحيات Service Role
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 5. جلب بيانات المحكّم من جدول reviewers
    const { data: reviewer, error: reviewerError } = await supabaseAdmin
      .from("reviewers")
      .select("id, full_name, email, is_active, accepted_at")
      .eq("id", reviewerId)
      .maybeSingle();

    if (reviewerError || !reviewer) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "تعذّر العثور على بيانات المحكّم.",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!reviewer.is_active) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "لا يمكن إرسال دعوة لمحكّم حسابه معطّل. يرجى تفعيل حسابه أولاً.",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 6. تحديد رابط إعادة التوجيه لتعيين كلمة المرور بالضبط
    const siteUrl = Deno.env.get("SITE_URL") || "http://localhost:5173";
    const redirectTo = body.redirectTo || `${siteUrl}/auth/set-password`;

    // 7. إرسال الدعوة عبر Supabase Auth Admin
    const { error: inviteError } = await supabaseAdmin.auth.admin.inviteUserByEmail(
      reviewer.email,
      {
        redirectTo,
        data: {
          full_name: reviewer.full_name,
        },
      }
    );

    if (inviteError) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `تعذّر إرسال الدعوة: ${inviteError.message}`,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 8. تحديث تاريخ الإرسال invited_at في جدول reviewers
    await supabaseAdmin
      .from("reviewers")
      .update({ invited_at: new Date().toISOString() })
      .eq("id", reviewer.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "تم إرسال بريد الدعوة إلى المحكّم بنجاح.",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    const errMessage = error instanceof Error ? error.message : "حدث خطأ غير متوقع.";
    return new Response(
      JSON.stringify({
        success: false,
        message: errMessage,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
