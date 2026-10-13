/**
 * Auth API facade. Only the mock exists — no Laravel auth contract yet (see CONTRACT-GAPS.md).
 * Swap the export for a real adapter when endpoints are shared.
 */
import { mockAuth } from "./mock/auth";

export const authApi = mockAuth;
export { MOCK_CODE } from "./mock/auth";
