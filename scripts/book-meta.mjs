// مشخصات فارسی کتاب‌ها و قفسه‌های کتابخانه
export const SHELVES = [
  { id: 'quran', title: 'قرآن و دعا' },
  { id: 'nahj', title: 'سخنان امیرالمؤمنین (ع)' },
  { id: 'arbaa', title: 'کتب اربعه' },
  { id: 'saduq', title: 'آثار شیخ صدوق' },
  { id: 'other', title: 'دیگر منابع حدیثی' },
  { id: 'sunni', title: 'منابع اهل سنت' },
]

const saduq = 'شیخ صدوق (محمد بن علی بن بابویه، د. ۳۸۱ ق)'
const kulayni = 'ثقة‌الاسلام کلینی (د. ۳۲۹ ق)'
const tusi = 'شیخ طوسی (د. ۴۶۰ ق)'
const kafiVol = ['اصول کافی: عقل، علم، توحید، حجت', 'اصول کافی: ایمان و کفر، دعا، قرآن، معاشرت', 'فروع کافی: طهارت، نماز، زکات', 'فروع کافی: روزه، حج، زیارت', 'فروع کافی: جهاد، تجارت، ازدواج', 'فروع کافی: خوراک، پوشاک، آداب زندگی', 'فروع کافی: وصیت، ارث، قضاوت', 'روضهٔ کافی: نامه‌ها، خطبه‌ها و مواعظ']

/** کلید: شناسهٔ کتاب در ثقلین */
export const BOOKS = {
  'Nahj-al-Balagha-Radi': { title: 'نهج‌البلاغه', author: 'گردآوری سید رضی (د. ۴۰۶ ق)', shelf: 'nahj', desc: 'خطبه‌ها، نامه‌ها و سخنان کوتاه امیرالمؤمنین علی (ع).', order: 1 },
  'Risalat-al-Huquq-Abidin': { title: 'رسالهٔ حقوق', author: 'منسوب به امام سجاد (ع)', shelf: 'other', desc: 'پنجاه حق: حق خدا، خود، اعضای بدن، پدر و مادر، همسر، همسایه و دیگران.', order: 1 },
  ...Object.fromEntries(
    kafiVol.map((d, i) => [`Al-Kafi-Volume-${i + 1}-Kulayni`, { title: `الکافی، جلد ${i + 1}`, author: kulayni, shelf: 'arbaa', desc: d, order: i + 1 }]),
  ),
  ...Object.fromEntries(
    [1, 2, 3, 4, 5].map((i) => [`Man-La-Yahduruh-al-Faqih-Volume-${i}-Saduq`, { title: `من لا یحضره الفقیه، جلد ${i}`, author: saduq, shelf: 'arbaa', desc: 'یکی از کتب اربعه؛ بیشتر احادیث احکام.', order: 10 + i }]),
  ),
  ...Object.fromEntries(
    [1, 2, 3, 4].map((i) => [`Tahdhib-al-Ahkam-Volume-${i}-Tusi`, { title: `تهذیب الاحکام، جلد ${i}`, author: tusi, shelf: 'arbaa', desc: 'یکی از کتب اربعه؛ احادیث احکام.', order: 20 + i }]),
  ),
  'Al-Amali-Saduq': { title: 'امالی', author: saduq, shelf: 'saduq', desc: 'احادیثی که شیخ صدوق در ۹۷ مجلس برای شاگردانش املا کرد: اخلاق، سیره و فضایل.', order: 1 },
  'Al-Khisal-Saduq': { title: 'خصال', author: saduq, shelf: 'saduq', desc: 'احادیث دسته‌بندی‌شده بر پایهٔ عدد: یک خصلت، دو خصلت… تا بیش از صد.', order: 2 },
  'Al-Tawhid-Saduq': { title: 'توحید', author: saduq, shelf: 'saduq', desc: 'احادیث شناخت خدا و صفات او.', order: 3 },
  'Uyun-akhbar-al-Rida-Volume-1-Saduq': { title: 'عیون اخبار الرضا (ع)، جلد ۱', author: saduq, shelf: 'saduq', desc: 'احادیث و سیرهٔ امام رضا (ع).', order: 4 },
  'Uyun-akhbar-al-Rida-Volume-2-Saduq': { title: 'عیون اخبار الرضا (ع)، جلد ۲', author: saduq, shelf: 'saduq', desc: 'احادیث و سیرهٔ امام رضا (ع).', order: 5 },
  'Maani-al-Akhbar-Saduq': { title: 'معانی الاخبار', author: saduq, shelf: 'saduq', desc: 'توضیح معنای واژه‌ها و تعبیرهای احادیث.', order: 6 },
  'Thawab-al-Amal-wa-iqab-al-Amal-Saduq': { title: 'ثواب الاعمال و عقاب الاعمال', author: saduq, shelf: 'saduq', desc: 'احادیث دربارهٔ پیامد کارهای نیک و بد.', order: 7 },
  'Kamal-al-Din-wa-Tamam-al-Nima-Saduq': { title: 'کمال الدین و تمام النعمة', author: saduq, shelf: 'saduq', desc: 'احادیث دربارهٔ امام زمان (عج) و غیبت.', order: 8 },
  'Sifat-al-Shia-Saduq': { title: 'صفات الشیعه', author: saduq, shelf: 'saduq', desc: 'ویژگی‌های پیروان راستین اهل‌بیت (ع).', order: 9 },
  'Fadail-al-Shia-Saduq': { title: 'فضائل الشیعه', author: saduq, shelf: 'saduq', desc: 'احادیث فضیلت دوستداران اهل‌بیت (ع).', order: 10 },
  'Fadail-al-Ashhur-al-Thalatha-Saduq': { title: 'فضائل الاشهر الثلاثه', author: saduq, shelf: 'saduq', desc: 'احادیث ماه‌های رجب، شعبان و رمضان.', order: 11 },
  'Al-Amali-Mufid': { title: 'امالی', author: 'شیخ مفید (د. ۴۱۳ ق)', shelf: 'other', desc: 'احادیثی که شیخ مفید در ۴۲ مجلس املا کرد.', order: 2 },
  'Kitab-al-Mumin-Ahwazi': { title: 'المؤمن', author: 'حسین بن سعید اهوازی', shelf: 'other', desc: 'احادیث دربارهٔ مؤمن، گرفتاری‌ها و حقوق برادران ایمانی.', order: 3 },
  'Kitab-al-Zuhd-Ahwazi': { title: 'الزهد', author: 'حسین بن سعید اهوازی', shelf: 'other', desc: 'احادیث دربارهٔ دل‌نبستن به دنیا و آمادگی برای آخرت.', order: 4 },
  'Kitab-al-Ghayba-Numani': { title: 'الغیبه', author: 'محمد بن ابراهیم نعمانی', shelf: 'other', desc: 'احادیث دربارهٔ غیبت امام دوازدهم (عج).', order: 5 },
  'Kitab-al-Ghayba-Tusi': { title: 'الغیبه', author: tusi, shelf: 'other', desc: 'احادیث دربارهٔ غیبت امام دوازدهم (عج).', order: 6 },
  'Kamil-al-Ziyarat-Qummi': { title: 'کامل الزیارات', author: 'ابن قولویه قمی (د. ۳۶۸ ق)', shelf: 'other', desc: 'احادیث زیارت پیامبر (ص) و امامان (ع).', order: 7 },
  'Al-Imama-wa’l-Tabsira-min-al-Hayra-Babawayh': { title: 'الامامة والتبصرة من الحیرة', author: 'علی بن بابویه (د. ۳۲۹ ق)', shelf: 'other', desc: 'احادیث دربارهٔ امامت.', order: 8 },
  'Mujam-al-Ahadith-al-Mutabara-Muhsini': { title: 'معجم الاحادیث المعتبره', author: 'شیخ محمدآصف محسنی', shelf: 'other', desc: 'گزیدهٔ احادیثی که به نظر گردآورنده سند معتبر دارند.', order: 9 },
  'Kitab-al-Duafa-Ghadairi': { title: 'کتاب الضعفاء', author: 'ابن غضائری', shelf: 'other', desc: 'کتاب رجالی: معرفی راویانی که ضعیف شمرده شده‌اند.', order: 10 },
}
