/** The one account that can see every organization and flip billing status (Trang quản trị).
 * Mirrored in firestore.rules' isSuperAdmin() — keep both in sync if this ever changes. */
export const SUPER_ADMIN_EMAIL = 'haunn.vietanhschool@gmail.com'
