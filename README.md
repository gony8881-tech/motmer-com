# منصة إدارة وتحكيم الأبحاث العلمية — حتى المرحلة الرابعة (Auth + Roles)

## 1. المشروع
منصة لإدارة المؤتمرات العلمية واستقبال الأبحاث المقدَّمة إليها، مبنية بواجهة عربية (RTL) ومتجاوبة (Mobile First).

## 2. الـ Stack
- React 18 + TypeScript + Vite
- React Router v6
- Tailwind CSS
- Supabase (Postgres + Auth + Storage) عبر `@supabase/supabase-js`

## 3. إعداد Supabase
1. أنشئ مشروعًا في https://supabase.com
2. من إعدادات المشروع (Project Settings → API) انسخ:
   - Project URL → ضعه في `VITE_SUPABASE_URL`
   - anon public key → ضعه في `VITE_SUPABASE_ANON_KEY`
3. طبّق ملفات الترحيل (migrations) الموجودة في `supabase/migrations/` **بالترتيب**:
   - `001_initial_schema.sql` (المرحلة الثانية — جدول `conferences`)
   - `002_submission_schema.sql` (المرحلة الثالثة — `researchers`, `papers`, `paper_versions`،
     الدالة الآمنة `submit_paper`، وإنشاء bucket التخزين `papers`)
   - `003_auth_roles.sql` (المرحلة الرابعة — `profiles`، الأدوار، RLS نهائية، سياسات Storage
     مبنية على الملكية الحقيقية)
   عبر Supabase CLI: `supabase db push`، أو بلصق محتوى كل ملف بالترتيب في SQL Editor بلوحة Supabase.
4. فعّل **Email/Password Auth** من Supabase Dashboard → Authentication → Providers (مفعّل
   افتراضيًا في أي مشروع جديد). لإنشاء أول Admin، انظر البند 12 أدناه.
5. (اختياري) لتجربة بيانات وهمية: نفّذ محتوى `supabase/seed.sql` يدويًا.

## 4. متغيرات البيئة
انسخ `.env.example` إلى `.env` واملأ القيم:
```bash
cp .env.example .env
```
لا تضع القيم الحقيقية داخل `.env.example` أو أي ملف يُرفع للمستودع.

## 5. تشغيل المشروع
```bash
npm install
npm run dev
```
إذا لم يتم إعداد `.env`، سيعرض التطبيق رسالة عربية واضحة بدل الانهيار.

## 6. Storage Bucket
تُنشئ Migration المرحلة الثالثة (`002_submission_schema.sql`) تلقائيًا bucket باسم **`papers`**
(خاص/private) لتخزين ملفات الأبحاث. بعد تطبيق `003_auth_roles.sql`، تصبح سياسات الوصول لهذا
الـ bucket مبنية على ملكية حقيقية (`owner = auth.uid()` أو Admin) بدل القراءة المفتوحة المؤقتة.
لا حاجة لإنشاء الـ bucket يدويًا من لوحة Supabase.

## 7. ما تم إنجازه في Phase 1
- الهيكل العام للمشروع (features/pages/components/layouts)، الأدوار الثلاثة
  (Admin/Researcher/Reviewer)، وواجهات مبدئية.

## 8. ما تم إنجازه في Phase 2
- إدارة المؤتمرات (CRUD كامل) عبر Supabase: إنشاء/تعديل/عرض، توليد slug فريد،
  حساب الحالة الفعلية (DRAFT/OPEN/CLOSED) بناءً على تاريخ اليوم، صفحة عامة للمؤتمر
  `/conference/:slug`، ونسخ/مشاركة رابط التقديم.

## 9. ما تم إنجازه في Phase 3
- **نظام تقديم البحث العلمي الكامل** من الرابط العام للمؤتمر (بدون تسجيل دخول):
  - معالج تقديم من 4 خطوات (بيانات الباحث ← بيانات البحث ← رفع الملف ← المراجعة والإرسال)
    في `/conference/:slug/submit`، مع الحفاظ على البيانات عند الرجوع بين الخطوات.
  - رفع ملفات PDF/DOC/DOCX (حتى 10 ميجابايت) إلى Supabase Storage (bucket خاص `papers`)
    بمسار منظّم `{conference_id}/{معرّف مؤقت}/v1/{filename}`.
  - إنشاء الباحث والبحث ونسخة الملف الأولى (Paper Version 1) بشكل **آمن وذرّي** عبر
    دالة قاعدة بيانات واحدة (`public.submit_paper`، SECURITY DEFINER) تتحقق من كل قواعد
    العمل (حالة المؤتمر، فترة التقديم، صحة البيانات، نوع/حجم الملف) قبل الكتابة —
    ولا تسمح لأي عميل بالكتابة المباشرة في جداول `researchers`/`papers`/`paper_versions`.
  - توليد رقم بحث فريد تلقائيًا بصيغة `PAPER-YYYY-NNNNN` (لا يُدخله الباحث يدويًا).
  - تنظيف (cleanup) للملف المرفوع في Storage تلقائيًا إذا نجح الرفع وفشل إنشاء البحث.
  - منع الإرسال المتكرر (تعطيل الزر + حارس داخلي أثناء الإرسال).
  - صفحة نجاح `/conference/:slug/submission-success` تعرض رقم البحث.
  - لوحة إدارة مبسّطة: عدد الأبحاث في `/admin/conferences/:id` وفي قائمة المؤتمرات،
    قائمة الأبحاث المقدَّمة `/admin/conferences/:id/submissions`، وتفاصيل بحث واحد
    `/admin/submissions/:id` (بدون تحكيم أو قبول/رفض).
  - Migration جديدة `002_submission_schema.sql` لا تُعدّل migration المرحلة الثانية.

## 10. ما لم يتم تنفيذه بعد (حتى نهاية Phase 3)
- نظام التحكيم (Reviewers / Review Committee / تعيين مراجعين) — الأساس فقط جاهز الآن (انظر Phase 4 أدناه).
- الانتقالات بين حالات البحث (Accept / Reject / Revision) — الحالات معرَّفة فقط.
- الإشعارات (Email / Push) — البنية جاهزة للتوسع مستقبلًا (`src/features/notifications`,
  `src/services/notifications`).
- تعدد النسخ الفعلي (Version 2, 3, ...) — الجدول والتصميم يدعمانه، لكن هذه المرحلة تُنشئ
  Version 1 فقط.
- شريط تقدّم دقيق بالبايت أثناء رفع الملف (المعروض حاليًا شريط تقدّم غير محدَّد القيمة/
  indeterminate لأن SDK الحالي لتخزين Supabase لا يعرض أحداث تقدّم أثناء الرفع من المتصفح).

---

# Phase 4 — Authentication & Roles

## 11. ما تم إنجازه في Phase 4
- **Supabase Auth حقيقي** (Email + Password): تسجيل حساب، تسجيل دخول، تسجيل خروج، استعادة/تعيين
  كلمة مرور، والحفاظ على الجلسة (Session) بعد تحديث الصفحة.
- **جدول `profiles`** (migration جديدة `003_auth_roles.sql`) مرتبط بـ `auth.users`، يحتوي على
  `role` (`ADMIN` / `RESEARCHER` / `REVIEWER`) و `is_active`. يُنشأ تلقائيًا عبر trigger عند
  التسجيل بدور `RESEARCHER` افتراضيًا فقط — لا يمكن لأي مستخدم اختيار `ADMIN` أو `REVIEWER` بنفسه.
- **حماية حقيقية على مستوى قاعدة البيانات (RLS)**: كل سياسات `temp_dev_*` المؤقتة من Phase 2/3
  حُذفت واستُبدلت بسياسات مبنية على الدور الحقيقي (`is_admin()` / `auth.uid()`)، على
  `conferences`, `researchers`, `papers`, `paper_versions`, وملفات Storage.
- **حماية Routes حقيقية** عبر `ProtectedRoute` (تسجيل دخول فقط) و `RoleRoute` (دور محدد)، مع
  `returnUrl` يحافظ على وجهة المستخدم الأصلية (مثال: يفتح رابط تقديم بحث لمؤتمر معيّن، يُطلب
  منه تسجيل الدخول، ثم يعود تلقائيًا لنفس صفحة التقديم لنفس المؤتمر).
- **ربط الباحث بحسابه الحقيقي**: `researchers.user_id` جديد (nullable للحفاظ على تقديمات
  Phase 3 المجهولة القديمة بدون حذفها). `submit_paper` أصبحت تتطلب تسجيل دخول، وتأخذ البريد
  الإلكتروني من حساب Auth الحقيقي (`auth.users`) لا من بيانات العميل — لمنع انتحال هوية باحث آخر.
- **لوحة الباحث حقيقية**: ترحيب باسم المستخدم، عدد أبحاثه، وقائمة أبحاثه بحالاتها — كلها عبر
  RLS مبنية على `auth.uid()` وليس عبر researcher_id يختاره العميل.
- **لوحة إدارة مستخدمين مبسّطة (`/admin/users`)** للعرض فقط (اسم/بريد/دور/حالة).

## 12. كيفية إنشاء أول Admin
لا توجد طريقة لإنشاء Admin من واجهة التسجيل (وهذا مقصود أمنيًا). الطريقة الموصى بها:
1. سجّل حسابًا عاديًا من `/register` (سيُنشأ بدور `RESEARCHER` تلقائيًا).
2. من لوحة Supabase → **SQL Editor**، نفّذ:
   ```sql
   update public.profiles set role = 'ADMIN' where email = 'admin@example.com';
   ```
3. سجّل الخروج والدخول من جديد (أو أعد تحميل الصفحة) ليتم التعرّف على الدور الجديد.

لا يوجد Secret أو كلمة مرور Admin مكتوبة في الكود أو في Git بأي شكل. ترقية مستخدم إلى
`REVIEWER` تتم بنفس الطريقة (`update ... set role = 'REVIEWER' ...`).

## 13. الأدوار (Roles)
`ADMIN` (مدير النظام) — `RESEARCHER` (باحث، الافتراضي عند التسجيل) — `REVIEWER` (محكّم، لا يمكن
لأي مستخدم أن يصبح محكّمًا بنفسه). الدور مخزَّن في قاعدة البيانات (`profiles.role`) وتعتمد عليه
RLS مباشرة — وليس مجرد قيمة في الواجهة.

## 14. RLS — أهم السياسات (`003_auth_roles.sql`)
- `conferences`: القراءة عامة لغير الـ DRAFT، والكتابة (Insert/Update/Delete) لـ Admin فقط.
- `researchers`: كل مستخدم يرى/يعدّل سجله المرتبط بـ `user_id = auth.uid()` فقط (أو Admin).
  لا سياسة Insert للعميل عمدًا — الإنشاء فقط عبر `submit_paper`.
- `papers`: الباحث يرى فقط أبحاثه (عبر `researcher_id` المرتبط بسجله)، ولا يستطيع أي Update
  مباشر (لا يمكنه تغيير `status` أو `researcher_id`). Reviewer بلا وصول عام في هذه المرحلة
  (سيُبنى في Phase 5). Admin له كل الصلاحيات.
- `paper_versions`: نفس منطق `papers` (عبر ربط `paper_id → researcher_id → user_id`).
- **Trigger** `prevent_role_self_escalation`: حتى لو استطاع مستخدم إرسال طلب تحديث على صفّه
  الشخصي في `profiles`، أي محاولة لتغيير `role` أو `is_active` تُرفض (تُعاد لقيمتها القديمة)
  ما لم يكن المنفّذ Admin فعليًا.
- Helper functions (`get_my_role`, `is_admin`, `is_researcher`, `is_reviewer`): `SECURITY DEFINER`
  + `search_path` ثابت لمنع أي recursion مع RLS الخاصة بـ `profiles` نفسها.

## 15. أمان Storage
Bucket `papers` يبقى خاصًا (private). بدل الاعتماد على قراءة مفتوحة، تعتمد السياسات الجديدة على
عمود `owner` الذي يضبطه Supabase Storage تلقائيًا = `auth.uid()` عند الرفع من عميل مسجّل دخول:
صاحب الملف أو Admin فقط يستطيع القراءة/الحذف. الرفع مسموح فقط لمستخدم مسجّل دخول وضمن مؤتمر
يقبل التقديم فعليًا حاليًا (`conference_accepts_submissions`).

## 16. تشغيل Migrations (بالترتيب)
```
001_initial_schema.sql
002_submission_schema.sql
003_auth_roles.sql
```
عبر `supabase db push` أو لصق كل ملف بالترتيب في SQL Editor.

## 17. اختبارات تم إجراؤها فعليًا
بسبب عدم توفر اتصال بالإنترنت في بيئة التنفيذ، **لم يتم تشغيل `npm install` أو `npm run build`
أو أي اختبار حي فعليًا** — تعذّر الوصول إلى `registry.npmjs.org` (خطأ 403) وإلى أي مشروع Supabase
حقيقي. تم بدلًا من ذلك:
- مراجعة يدوية دقيقة لكل الأنواع (TypeScript) والاستيرادات للتأكد من توافقها مع
  `strict` + `noUnusedLocals` + `noUnusedParameters` + `noUncheckedIndexedAccess` المفعّلة في
  `tsconfig.json`.
- مراجعة منطقية لكل استعلام SQL وسياسة RLS يدويًا (لا تنفيذ فعلي على قاعدة بيانات).
- تتبّع يدوي لتدفقات: تسجيل/دخول/خروج، إعادة التوجيه بعد الدخول، `returnUrl`، ومحاولة الوصول
  لمسار دور آخر.

**لم يتم اختباره فعليًا** (يحتاج مشروع Supabase حقيقي ومتصفحًا فعليًا): تنفيذ RLS الحقيقي على
بيانات فعلية، سلوك `owner` في Supabase Storage عبر إصدارات مختلفة، رسائل أخطاء Supabase Auth
الفعلية (تمت ترجمتها بناءً على الرسائل الشائعة الموثّقة من Supabase وليس عبر استدعاء حقيقي).

## 18. قيود معروفة (Known Limitations)
- عمود `owner` على `storage.objects`: هذا هو الاسم التاريخي/الشائع في Supabase Storage. إذا
  كان مشروعك يستخدم إصدارًا يعتمد فقط على `owner_id text`، عدّل سياسات `003_auth_roles.sql`
  الخاصة بـ Storage لاستخدام `owner_id = auth.uid()::text` بدلًا من `owner = auth.uid()`.
- لا توجد واجهة لتغيير الأدوار (ترقية Reviewer/Admin) من التطبيق — تتم يدويًا من SQL Editor
  حاليًا (انظر البند 12). بناء ذلك بأمان يتطلب Supabase Edge Function بصلاحيات Service Role
  (لا يجوز استخدامها في الـ Frontend) — مؤجَّل لمرحلة قادمة.
- تأكيد البريد الإلكتروني (Email Confirmation) يعتمد على إعدادات مشروع Supabase نفسه؛ الواجهة
  تتعامل مع الحالتين (تفعيل فوري أو الحاجة لتأكيد البريد) لكن لم يُختبر أي منهما فعليًا.
- سجلات `researchers` القديمة من التقديم المجهول (Phase 3، قبل تفعيل Auth) تبقى بـ
  `user_id = NULL` ولا تُربط تلقائيًا بأي حساب — الربط اليدوي متروك لـ Admin مستقبلًا، تفاديًا
  لأي التباس أمني (لا يمكن لمستخدم جديد "استرجاع" تقديم قديم بمجرد معرفة نفس البريد).
- Reviewer: الأساس فقط (الدور + الحماية) بلا أي وظيفة تحكيم فعلية (Phase 5).
