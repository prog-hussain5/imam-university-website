/**
 * Student Data Generator
 * Generates 1200 realistic Iraqi Arabic student records
 * جامعة الإمام جعفر الصادق - قسم هندسة تقنيات الحاسوب
 */

(function () {
  'use strict';

  // ── Seeded PRNG (LCG) for consistent, reproducible data ──────────────────
  function createRNG(seed) {
    let s = seed >>> 0;
    return {
      next() {
        s = Math.imul(1664525, s) + 1013904223 >>> 0;
        return s / 0x100000000;
      },
      int(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
      },
      pick(arr) {
        return arr[Math.floor(this.next() * arr.length)];
      }
    };
  }

  const rng = createRNG(0xABCDEF);

  // ── Name Pools ────────────────────────────────────────────────────────────
  const maleFirstNames = [
    'محمد', 'علي', 'حسين', 'أحمد', 'عمر', 'كريم', 'مرتضى', 'حيدر', 'زيد',
    'باسم', 'ياسر', 'أمير', 'قاسم', 'جعفر', 'هادي', 'طه', 'عباس', 'صادق',
    'مصطفى', 'إبراهيم', 'رضا', 'سامر', 'ماجد', 'وليد', 'أياد', 'لؤي', 'رعد',
    'سعد', 'فارس', 'ناصر', 'تامر', 'بشار', 'أوس', 'زياد', 'أسامة', 'منتظر',
    'حمزة', 'عبدالله', 'يوسف', 'خالد', 'تقي', 'سجاد', 'علاء', 'عدي', 'نبيل',
    'عمار', 'كرار', 'رسول', 'مجتبى', 'طارق', 'نزار', 'بلال', 'أنس', 'معاذ',
    'يحيى', 'عيسى', 'جواد', 'موسى', 'نوح', 'جاسم', 'حازم', 'مازن', 'غسان',
    'رائد', 'دانيال', 'لقمان', 'سلمان', 'قيس', 'ثامر', 'عمران', 'مؤيد'
  ];

  const femaleFirstNames = [
    'زهراء', 'فاطمة', 'نور', 'سارة', 'رنا', 'هبة', 'دعاء', 'لمى', 'أمل',
    'ريم', 'وسام', 'حوراء', 'بتول', 'هناء', 'سناء', 'أنوار', 'رشا', 'ليلى',
    'منى', 'سمر', 'زينب', 'مروة', 'هديل', 'روان', 'شيماء', 'غزل', 'بيان',
    'حلا', 'يسرى', 'لجين', 'دينا', 'هيفاء', 'ندى', 'رؤى', 'إيمان', 'صفاء',
    'وفاء', 'آلاء', 'نداء', 'شذى', 'رغد', 'أريج', 'تسنيم', 'ميس', 'رهف',
    'إسراء', 'كوثر', 'سجود', 'هاجر', 'أسماء', 'نسرين', 'لارا', 'إيلاف',
    'بشرى', 'بلقيس', 'حنان', 'رقية', 'صبا', 'نيفين', 'لبنى'
  ];

  const fatherNames = [
    'علي', 'حسين', 'كاظم', 'جعفر', 'محمد', 'عباس', 'فاضل', 'مهدي', 'كريم',
    'حسن', 'صادق', 'موسى', 'ناجي', 'طاهر', 'جابر', 'راضي', 'خليل', 'سلمان',
    'ياسر', 'عودة', 'رحيم', 'ثامر', 'زاهر', 'عامر', 'ناصر', 'صالح', 'طالب',
    'ماجد', 'رياض', 'عدنان', 'قاسم', 'لطيف', 'شاكر', 'باقر', 'هادي', 'عزيز',
    'جاسم', 'سلام', 'نافع', 'طارق', 'وهاب', 'فليح', 'نعيم', 'حاتم', 'سعيد',
    'أكرم', 'بسام', 'نضال', 'يوسف', 'إبراهيم'
  ];

  const lastNames = [
    'الخفاجي', 'الزبيدي', 'العبيدي', 'الكريمي', 'الحسيني', 'الموسوي',
    'البغدادي', 'الكوفي', 'الربيعي', 'النجفي', 'الكربلائي', 'الحلي',
    'العاملي', 'الصدري', 'العلوي', 'الهاشمي', 'البصري', 'الفراتي',
    'الديواني', 'الكاظمي', 'الجعفري', 'المعموري', 'الشمري', 'الدليمي',
    'الجبوري', 'العاني', 'التميمي', 'الأسدي', 'الزهيري', 'القيسي',
    'الساعدي', 'المالكي', 'الغانمي', 'الجنابي', 'الركابي', 'الميالي',
    'الحميداوي', 'العجيلي', 'الحيدري', 'البديري', 'الطائي', 'المشهداني'
  ];

  // ── Stage & Subject Data ──────────────────────────────────────────────────
  const stages = ['الأولى', 'الثانية', 'الثالثة', 'الرابعة'];

  const subjectsByStage = {
    'الأولى': [
      'رياضيات هندسية', 'فيزياء عامة', 'برمجة بلغة C',
      'إلكترونيات أساسية', 'دوائر كهربائية', 'لغة إنجليزية تقنية'
    ],
    'الثانية': [
      'هياكل البيانات', 'رياضيات متقطعة', 'برمجة كائنية التوجه',
      'نظم رقمية', 'إحصاء واحتمالات', 'دوائر منطقية'
    ],
    'الثالثة': [
      'قواعد البيانات', 'شبكات الحاسوب', 'نظم التشغيل',
      'معالجات دقيقة', 'هندسة البرمجيات', 'أمن المعلومات'
    ],
    'الرابعة': [
      'ذكاء اصطناعي', 'تعلم الآلة', 'حوسبة سحابية',
      'أمن الشبكات', 'تطوير التطبيقات', 'مشروع التخرج'
    ]
  };

  const academicYears = ['2022-2023', '2023-2024', '2024-2025'];

  // ── Grade Generator (normal distribution via Box-Muller) ─────────────────
  function normalGrade(rng, max, mean, std) {
    let u1, u2;
    do { u1 = rng.next(); } while (u1 < 1e-10);
    u2 = rng.next();
    const z = Math.sqrt(-2 * Math.log(u1)) * Math.cos(2 * Math.PI * u2);
    return Math.max(0, Math.min(max, Math.round(mean + z * std)));
  }

  // ── Generate 1200 Students ────────────────────────────────────────────────
  const students = [];
  const TOTAL_STUDENTS = 1200;

  for (let id = 1; id <= TOTAL_STUDENTS; id++) {
    const isMale  = rng.next() < 0.58; // ~58% male
    const firstName = isMale ? rng.pick(maleFirstNames) : rng.pick(femaleFirstNames);
    const father    = rng.pick(fatherNames);
    const last      = rng.pick(lastNames);
    const fullName  = `${firstName} ${father} ${last}`;

    const stage    = rng.pick(stages);
    const subject  = rng.pick(subjectsByStage[stage]);
    const year     = rng.pick(academicYears);

    // Skills bias: better students score higher overall
    const skillBias = rng.next(); // 0..1, used to correlate grades

    // Quizzes (each /10, total /20)
    const qMean = 6.5 + skillBias * 3;
    const quiz1 = normalGrade(rng, 10, qMean, 1.5);
    const quiz2 = normalGrade(rng, 10, qMean, 1.5);
    const quizzesTotal = quiz1 + quiz2;

    // Reports (each /10, total /20)
    const rMean = 7.0 + skillBias * 2.5;
    const report1 = normalGrade(rng, 10, rMean, 1.4);
    const report2 = normalGrade(rng, 10, rMean, 1.4);
    const reportsTotal = report1 + report2;

    // Activity total (max 40)
    const activitiesTotal = quizzesTotal + reportsTotal;

    // Exam (max 50)
    const eMean = 29 + skillBias * 18;
    const exam  = normalGrade(rng, 50, eMean, 7);

    // Attendance (max 5) – mostly high
    const attendance   = normalGrade(rng, 5, 4.0 + skillBias * 0.8, 0.9);
    // Participation (max 5)
    const participation = normalGrade(rng, 5, 3.2 + skillBias * 1.5, 0.9);

    const supportTotal = attendance + participation; // max 10
    const grandTotal   = activitiesTotal + exam + supportTotal; // max 100

    students.push({
      id,
      name: fullName,
      gender: isMale ? 'male' : 'female',
      stage,
      subject,
      year,
      quiz1,
      quiz2,
      quizzesTotal,
      report1,
      report2,
      reportsTotal,
      activitiesTotal,
      exam,
      attendance,
      participation,
      supportTotal,
      grandTotal
    });
  }

  window.studentsData = students;

  // ── Unique subject list (for filter dropdown) ─────────────────────────────
  window.allSubjects = [...new Set(students.map(s => s.subject))].sort((a, b) =>
    a.localeCompare(b, 'ar')
  );

})();
