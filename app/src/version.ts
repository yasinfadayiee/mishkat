/** شمارهٔ نسخه با رقم فارسی، مثلاً «۰٫۸» */
export const VERSION = __APP_VERSION__.replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[Number(d)]).replace(/\./g, '٫')
