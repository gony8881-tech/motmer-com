import { env } from "@/app/config/env";

/**
 * عميل API مركزي — واجهة موحّدة بين الـ Components وأي Backend مستقبلي.
 * القاعدة: UI → Feature Logic → Service/Repository (هذا الملف) → Backend.
 * هذه المرحلة: هيكل فقط، بدون اتصال فعلي بأي خادم.
 */
class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  async get<T>(_path: string): Promise<T> {
    throw new Error("لم يتم ربط Backend بعد — هذه المرحلة تجهّز الهيكل فقط.");
  }

  async post<T>(_path: string, _body: unknown): Promise<T> {
    throw new Error("لم يتم ربط Backend بعد — هذه المرحلة تجهّز الهيكل فقط.");
  }
}

export const apiClient = new ApiClient(env.apiBaseUrl);
