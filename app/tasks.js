export const UI = {
  en: {
    title: "Satr — paperwork, one line at a time",
    kicker: "Newcomer paperwork",
    skip: "Skip to the checklist",
    headline: "Paperwork, one line at a time.",
    deck: "A checklist for people new to the United States. Choose a task, see the documents and the order, and tick them off on this device.",
    direction: "Direction: left to right",
    langButton: "العربية",
    langPressed: false,
    open: "Open",
    searchLabel: "Search tasks",
    searchEmpty: "No task matches that search.",
    back: "All tasks",
    documents: "Documents",
    steps: "Steps",
    say: "What to say",
    copy: "Copy this sentence",
    copied: "Copied",
    official: "Official source",
    reset: "Clear checks for this task",
    disclaimer:
      "A practical checklist, not legal advice. Rules change by state. Confirm the official source before your appointment.",
    ready: (count) =>
      count === 0 ? "Nothing checked on this device yet." : `${count} documents marked ready on this device.`,
  },
  ar: {
    title: "سطر — الأوراق، سطرًا بسطر",
    kicker: "أوراق القادمين الجدد",
    skip: "انتقل إلى القائمة",
    headline: "الأوراق، سطرًا بسطر.",
    deck: "قائمة للقادمين الجدد إلى الولايات المتحدة. اختر مهمة، واطلع على المستندات وترتيبها، وعلّم ما جهّزته على هذا الجهاز.",
    direction: "الاتجاه: من اليمين إلى اليسار",
    langButton: "English",
    langPressed: true,
    open: "افتح",
    searchLabel: "ابحث عن مهمة",
    searchEmpty: "لا توجد مهمة بهذا البحث.",
    back: "كل المهام",
    documents: "المستندات",
    steps: "الخطوات",
    say: "ماذا تقول",
    copy: "انسخ هذه الجملة",
    copied: "تم النسخ",
    official: "المصدر الرسمي",
    reset: "امسح علامات هذه المهمة",
    disclaimer:
      "هذه قائمة عملية وليست استشارة قانونية. تختلف القواعد حسب الولاية. راجع المصدر الرسمي قبل موعدك.",
    ready: (count) =>
      count === 0 ? "لم تُعلَّم أي مستندات على هذا الجهاز بعد." : `${count} مستندات جاهزة على هذا الجهاز.`,
  },
};

export const TASKS = [
  {
    id: "state-id",
    href: "https://www.usa.gov/motor-vehicle-services",
    en: {
      title: "Get a state ID",
      summary: "A state photo ID, or a driver's license, is what banks, schools, and landlords ask for first.",
      office: "Your state DMV",
      time: "One visit, then 2–6 weeks for the card",
      fee: "Often $10–$60, set by the state",
      say: "I would like a state identification card. I have my passport, proof of address, and my Social Security document.",
      documents: [
        {
          id: "identity",
          name: "Proof of identity",
          detail: "An unexpired foreign passport, or a birth certificate plus another photo ID. Bring the original.",
        },
        {
          id: "ssn",
          name: "Social Security proof",
          detail: "The card, a W-2, or a pay stub with the full number. Some states accept a letter if you are not eligible yet.",
        },
        {
          id: "residency",
          name: "Two proofs of address",
          detail: "A lease, a utility bill, a bank statement, or official mail in your name. The date usually needs to be recent.",
        },
        {
          id: "appointment",
          name: "Appointment confirmation",
          detail: "Keep the confirmation on your phone or on paper. Walk-in lines are long in many cities.",
        },
      ],
      steps: [
        "Open your state DMV site and choose a state ID or a driver's license. REAL ID has a stricter list than a standard card.",
        "Gather originals. A photocopy is not enough unless the site says it is.",
        "Book the earliest appointment you can. Bring every document on the list for your state.",
        "At the counter: a photo, a fee, and a vision test if you want a license to drive.",
        "You leave with temporary paper. The plastic card comes by mail. Do not laminate the paper.",
      ],
    },
    ar: {
      title: "استخراج بطاقة هوية الولاية",
      summary: "بطاقة الولاية بالصورة، أو رخصة القيادة، هي الوثيقة التي تطلبها البنوك والمدارس وأصحاب العقارات أولًا.",
      office: "إدارة المركبات في ولايتك",
      time: "زيارة واحدة، ثم من أسبوعين إلى ستة لوصول البطاقة",
      fee: "غالبًا بين ١٠ و٦٠ دولارًا، حسب الولاية",
      say: "أريد بطاقة هوية للولاية. معي جواز سفري، وإثبات العنوان، ووثيقة الضمان الاجتماعي.",
      documents: [
        {
          id: "identity",
          name: "إثبات الهوية",
          detail: "جواز سفر أجنبي ساري، أو شهادة ميلاد مع وثيقة صورة أخرى. أحضر الأصل.",
        },
        {
          id: "ssn",
          name: "إثبات رقم الضمان الاجتماعي",
          detail: "البطاقة، أو نموذج W-2، أو قسيمة راتب يظهر فيها الرقم كاملًا. بعض الولايات تقبل رسالة إذا لم تكن مؤهلًا بعد.",
        },
        {
          id: "residency",
          name: "إثباتان للعنوان",
          detail: "عقد إيجار، أو فاتورة خدمات، أو كشف حساب، أو بريد رسمي باسمك. التاريخ يجب أن يكون حديثًا غالبًا.",
        },
        {
          id: "appointment",
          name: "تأكيد الموعد",
          detail: "احتفظ بالتأكيد على هاتفك أو ورقيًا. طوابير الحضور بلا موعد طويلة في مدن كثيرة.",
        },
      ],
      steps: [
        "افتح موقع إدارة المركبات في ولايتك واختر بطاقة هوية أو رخصة قيادة. متطلبات REAL ID أشد من البطاقة العادية.",
        "اجمع الأصول. الصورة غير كافية إلا إذا قال الموقع ذلك.",
        "احجز أقرب موعد، واحمل كل مستند تطلبه ولايتك.",
        "عند الشباك: صورة، ورسوم، وفحص نظر إذا أردت رخصة قيادة.",
        "تخرج بورقة مؤقتة، وتصل البطاقة البلاستيكية بالبريد. لا تغلّف الورقة.",
      ],
    },
  },
  {
    id: "bank",
    href: "https://www.consumerfinance.gov/consumer-tools/bank-accounts/",
    en: {
      title: "Open a bank account",
      summary: "A checking account for pay, rent, and a debit card. A credit union is often easier with a short US history.",
      office: "A bank or credit union branch",
      time: "About an hour, sometimes the same day",
      fee: "Ask for an account with no monthly fee",
      say: "I am new to the United States and I want a low-fee checking account. I do not want overdraft fees.",
      documents: [
        {
          id: "photo-id",
          name: "Government photo ID",
          detail: "A passport or a state ID. The name should match the name you want on the account.",
        },
        {
          id: "tax-id",
          name: "Social Security number or ITIN",
          detail: "Some banks can start with a passport and add the number later. Ask before you take a day off.",
        },
        {
          id: "address",
          name: "Proof of address",
          detail: "A lease, a letter from a shelter or host, or a bill. Call and ask which papers they accept.",
        },
        {
          id: "deposit",
          name: "Opening deposit",
          detail: "Many accounts open with $0 to $25. Ask before you go so you are not turned away.",
        },
      ],
      steps: [
        "Compare two places: monthly fee, minimum balance, and what happens if a payment is short.",
        "Ask whether they open accounts for customers without a long US credit history.",
        "Book a visit or apply online. Bring originals.",
        "Decline overdraft coverage if you do not want a fee when the balance is short.",
        "Turn on phone alerts and, if you have a job, ask how to set up direct deposit.",
      ],
    },
    ar: {
      title: "فتح حساب بنكي",
      summary: "حساب جارٍ للراتب والإيجار وبطاقة سحب. اتحاد الائتمان أسهل غالبًا لمن تاريخه في أمريكا قصير.",
      office: "فرع بنك أو اتحاد ائتمان",
      time: "نحو ساعة، وأحيانًا في اليوم نفسه",
      fee: "اطلب حسابًا بلا رسوم شهرية",
      say: "أنا جديد في الولايات المتحدة وأريد حسابًا جاريًا برسوم منخفضة. لا أريد رسوم السحب على المكشوف.",
      documents: [
        {
          id: "photo-id",
          name: "هوية حكومية بالصورة",
          detail: "جواز سفر أو بطاقة ولاية. يجب أن يطابق الاسمُ الاسمَ الذي تريده على الحساب.",
        },
        {
          id: "tax-id",
          name: "رقم الضمان الاجتماعي أو ITIN",
          detail: "بعض البنوك تبدأ بجواز السفر وتضيف الرقم لاحقًا. اسأل قبل أن تأخذ إجازة من العمل.",
        },
        {
          id: "address",
          name: "إثبات العنوان",
          detail: "عقد إيجار، أو رسالة من مأوى أو مضيف، أو فاتورة. اتصل واسأل أي أوراق يقبلون.",
        },
        {
          id: "deposit",
          name: "مبلغ فتح الحساب",
          detail: "كثير من الحسابات تُفتح بمبلغ من صفر إلى ٢٥ دولارًا. اسأل قبل الذهاب حتى لا تُرفض.",
        },
      ],
      steps: [
        "قارن مكانين: الرسوم الشهرية، والحد الأدنى للرصيد، وما يحدث إذا نقص المبلغ.",
        "اسأل إن كانوا يفتحون حسابات لمن ليس لديه تاريخ ائتماني طويل في أمريكا.",
        "احجز زيارة أو قدّم عبر الإنترنت، واحمل الأصول.",
        "ارفض تغطية السحب على المكشوف إذا كنت لا تريد رسمًا عند نقص الرصيد.",
        "فعّل تنبيهات الهاتف، وإذا كنت تعمل فاسأل عن الإيداع المباشر.",
      ],
    },
  },
  {
    id: "ssn",
    href: "https://www.ssa.gov/ssnumber/",
    en: {
      title: "Get a Social Security card",
      summary: "Apply when Social Security says you are eligible. The card is free. A number is not required for every service.",
      office: "A Social Security office",
      time: "One visit, card by mail in about two weeks",
      fee: "Free. Anyone who charges you is not the SSA.",
      say: "I need a Social Security card. I am eligible to apply and I brought my passport and immigration documents.",
      documents: [
        {
          id: "ss5",
          name: "Form SS-5",
          detail: "Fill it in before you go. Leave the number blank if this is your first card.",
        },
        {
          id: "passport",
          name: "Passport or birth record",
          detail: "Bring the original. A photo on your phone is not a substitute.",
        },
        {
          id: "status",
          name: "Immigration status document",
          detail: "Examples: an I-94, a work permit, or a permanent resident card. Eligibility depends on your status.",
        },
        {
          id: "extra-id",
          name: "One more identity document",
          detail: "Bring it if you have it. The office list says which second document they accept.",
        },
      ],
      steps: [
        "Read the Social Security page for your immigration status and confirm you may apply.",
        "Complete form SS-5. Do not pay a website that offers to fill it for a fee.",
        "Book an appointment or visit the local office with originals.",
        "You do not pay at the window. Keep the receipt they give you.",
        "The card arrives by mail. Memorize the number and keep the card at home, not in a wallet.",
      ],
    },
    ar: {
      title: "الحصول على بطاقة الضمان الاجتماعي",
      summary: "قدّم عندما يقول الضمان الاجتماعي إنك مؤهل. البطاقة مجانية. وليس كل إجراء يطلب الرقم.",
      office: "مكتب الضمان الاجتماعي",
      time: "زيارة واحدة، والبطاقة بالبريد خلال أسبوعين تقريبًا",
      fee: "مجانية. من يطلب منك مالًا ليس مكتب الضمان.",
      say: "أحتاج بطاقة ضمان اجتماعي. أنا مؤهل للتقديم، ومعي جواز سفري ووثائق الهجرة.",
      documents: [
        {
          id: "ss5",
          name: "نموذج SS-5",
          detail: "املأه قبل الذهاب. اترك خانة الرقم فارغة إذا كانت هذه بطاقتك الأولى.",
        },
        {
          id: "passport",
          name: "جواز السفر أو سجل الميلاد",
          detail: "أحضر الأصل. صورة على الهاتف لا تغني عن الوثيقة.",
        },
        {
          id: "status",
          name: "وثيقة وضع الهجرة",
          detail: "مثل I-94، أو تصريح العمل، أو بطاقة الإقامة الدائمة. الأهلية تعتمد على وضعك.",
        },
        {
          id: "extra-id",
          name: "وثيقة هوية إضافية",
          detail: "أحضرها إن وُجدت. قائمة المكتب تبيّن الوثيقة الثانية المقبولة.",
        },
      ],
      steps: [
        "اقرأ صفحة الضمان الاجتماعي الخاصة بوضع هجرتك وتأكد أن لك حق التقديم.",
        "أكمل نموذج SS-5. لا تدفع لموقع يعرض تعبئته مقابل رسوم.",
        "احجز موعدًا أو زر المكتب المحلي ومعك الأصول.",
        "لا تدفع عند الشباك. احتفظ بالإيصال.",
        "تصل البطاقة بالبريد. احفظ الرقم، وأبقِ البطاقة في البيت لا في المحفظة.",
      ],
    },
  },
  {
    id: "school",
    href: "https://www.ed.gov/",
    en: {
      title: "Enroll a child in school",
      summary: "Public school is free for children who live in the district. Start even if the folder is not perfect.",
      office: "The school district for your address",
      time: "A call, then one enrollment visit",
      fee: "No tuition for public school",
      say: "We live at this address and I want to enroll my child. We are new here. I need an interpreter, please.",
      documents: [
        {
          id: "age",
          name: "Proof of the child's age",
          detail: "A birth certificate or passport. Ask what they accept if the record is in another language.",
        },
        {
          id: "home",
          name: "Proof you live in the district",
          detail: "A lease, a bill, or a letter from the person you live with. The district posts the list.",
        },
        {
          id: "shots",
          name: "Immunization record",
          detail: "Bring what you have. The school can tell you which vaccines are still needed.",
        },
        {
          id: "guardian",
          name: "Parent or guardian photo ID",
          detail: "A passport is enough to start the conversation in many districts.",
        },
      ],
      steps: [
        "Find the district for your address and call the enrollment office. Ask what they accept from families new to the US.",
        "A Social Security number is not required to enroll. Say so if someone turns you away for not having one.",
        "Bring the records you have. Ask for an interpreter. That help is free.",
        "Ask about the bus, school meals, and the first day.",
        "You can request records from the previous school later. Enrollment should not wait on a perfect file.",
      ],
    },
    ar: {
      title: "تسجيل طفل في المدرسة",
      summary: "المدرسة الحكومية مجانية للأطفال الذين يسكنون داخل المنطقة. ابدأ حتى لو لم يكتمل الملف.",
      office: "المنطقة التعليمية لعنوانك",
      time: "مكالمة، ثم زيارة تسجيل واحدة",
      fee: "لا رسوم للتعليم في المدرسة الحكومية",
      say: "نسكن في هذا العنوان وأريد تسجيل طفلي. نحن جدد هنا. أحتاج مترجمًا من فضلكم.",
      documents: [
        {
          id: "age",
          name: "إثبات عمر الطفل",
          detail: "شهادة ميلاد أو جواز سفر. اسأل ماذا يقبلون إذا كانت الوثيقة بلغة أخرى.",
        },
        {
          id: "home",
          name: "إثبات السكن داخل المنطقة",
          detail: "عقد إيجار، أو فاتورة، أو رسالة من الشخص الذي تسكن معه. المنطقة تنشر القائمة.",
        },
        {
          id: "shots",
          name: "سجل التطعيمات",
          detail: "أحضر ما لديك. المدرسة تخبرك بالتطعيمات المتبقية.",
        },
        {
          id: "guardian",
          name: "هوية ولي الأمر بالصورة",
          detail: "جواز السفر يكفي لبدء الحديث في مناطق كثيرة.",
        },
      ],
      steps: [
        "حدّد المنطقة التعليمية لعنوانك واتصل بمكتب التسجيل. اسأل ماذا يقبلون من الأسر الجديدة في أمريكا.",
        "رقم الضمان الاجتماعي ليس شرطًا للتسجيل. قل ذلك إذا رُفضتم بسبب غيابه.",
        "أحضر السجلات التي معك، واطلب مترجمًا. هذه المساعدة مجانية.",
        "اسأل عن الحافلة، ووجبات المدرسة، واليوم الأول.",
        "يمكن طلب سجلات المدرسة السابقة لاحقًا. لا ينبغي أن ينتظر التسجيل ملفًا كاملًا.",
      ],
    },
  },
  {
    id: "clinic",
    href: "https://findahealthcenter.hrsa.gov/",
    en: {
      title: "Find a low-cost clinic",
      summary: "Community health centers see you without insurance and can lower the fee based on income.",
      office: "A HRSA health center near you",
      time: "A phone call, then a new-patient visit",
      fee: "Sliding scale if you qualify",
      say: "I need a new-patient visit. I do not have insurance. Do you offer a lower fee based on income, and an interpreter?",
      documents: [
        {
          id: "id",
          name: "Photo ID if you have one",
          detail: "A passport or any photo ID. If you do not have one yet, call and ask anyway.",
        },
        {
          id: "insurance",
          name: "Insurance card, if you have one",
          detail: "Bring it. If you have no insurance, you can still ask for an appointment.",
        },
        {
          id: "meds",
          name: "A list of medicines",
          detail: "Write the name and the dose. In both languages if that helps you explain.",
        },
        {
          id: "income",
          name: "Proof of income, only for a lower fee",
          detail: "A pay stub or a letter. You do not need it to be seen. You need it to ask for the reduced fee.",
        },
      ],
      steps: [
        "Search the HRSA finder for a health center near your address.",
        "Call and say you are a new patient. Ask what to bring and whether an interpreter is available.",
        "You can be seen without insurance. Ask for the income-based fee if money is tight.",
        "Write your symptoms before you go, in the language you think in.",
        "Ask for a printed visit summary before you leave.",
      ],
    },
    ar: {
      title: "إيجاد عيادة منخفضة التكلفة",
      summary: "مراكز الصحة المجتمعية تستقبلك بلا تأمين، ويمكنها تخفيض الرسوم حسب الدخل.",
      office: "مركز صحي قريب عبر HRSA",
      time: "مكالمة، ثم زيارة مريض جديد",
      fee: "رسوم مخفّضة حسب الدخل إذا كنت مؤهلًا",
      say: "أحتاج زيارة مريض جديد. ليس لدي تأمين. هل لديكم رسوم مخفّضة حسب الدخل، ومترجم؟",
      documents: [
        {
          id: "id",
          name: "هوية بالصورة إن وُجدت",
          detail: "جواز سفر أو أي هوية صورة. إذا لم تكن معك بعد، اتصل واسأل على أي حال.",
        },
        {
          id: "insurance",
          name: "بطاقة التأمين إن وُجدت",
          detail: "أحضرها. وإذا لم يكن لديك تأمين فما زال بإمكانك طلب موعد.",
        },
        {
          id: "meds",
          name: "قائمة الأدوية",
          detail: "اكتب الاسم والجرعة. باللغتين إذا كان ذلك يساعدك على الشرح.",
        },
        {
          id: "income",
          name: "إثبات الدخل لطلب الرسوم المخفّضة فقط",
          detail: "قسيمة راتب أو رسالة. لست محتاجًا إليه لتُعاين. تحتاجه لتطلب الرسوم المخفّضة.",
        },
      ],
      steps: [
        "ابحث في دليل HRSA عن مركز صحي قريب من عنوانك.",
        "اتصل وقل إنك مريض جديد. اسأل ماذا تحضر وهل يتوفر مترجم.",
        "يمكن معاينتك بلا تأمين. اطلب الرسوم حسب الدخل إذا كان المال ضيقًا.",
        "اكتب أعراضك قبل الذهاب، باللغة التي تفكر بها.",
        "اطلب ملخص الزيارة مطبوعًا قبل أن تغادر.",
      ],
    },
  },
];

export function taskById(id) {
  return TASKS.find((task) => task.id === id) ?? null;
}

export function countDocuments(tasks = TASKS) {
  return tasks.reduce((sum, task) => sum + task.en.documents.length, 0);
}
