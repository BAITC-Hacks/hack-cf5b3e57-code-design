import type {
  Category,
  City,
  EventFormat,
  Language,
  Locale,
} from "../../../../shared/contract";

export interface CatalogMessages {
  metadata: {
    catalogTitle: string;
    catalogDescription: string;
    detailTitle: string;
    detailDescription: string;
  };
  header: {
    homeAria: string;
    brand: string;
    tagline: string;
    catalog: string;
    match: string;
    assistant: string;
    jury: string;
    chooseWithAi: string;
    localeAria: string;
    navigationAria: string;
  };
  values: {
    cities: Record<City, string>;
    categories: Record<Category, string>;
    eventFormats: Record<EventFormat, string>;
    languages: Record<Language, string>;
  };
  filters: {
    title: string;
    description: string;
    reset: string;
    city: string;
    allCities: string;
    category: string;
    allCategories: string;
    eventFormat: string;
    anyFormat: string;
    language: string;
    anyLanguage: string;
    priceFrom: string;
    priceTo: string;
    minPricePlaceholder: string;
    maxPricePlaceholder: string;
    submit: string;
  };
  photo: {
    missingAlt: string;
    imageAlt: string;
    disclosure: string;
    contractorFallback: string;
  };
  card: {
    profileAria: string;
    priceFrom: string;
    formats: string;
    languages: string;
    duration: string;
    unlimited: string;
    upToHours: string;
    dataAria: string;
    synthetic: string;
    cityImputed: string;
    priceImputed: string;
    profile: string;
    checkWithAi: string;
  };
  catalog: {
    heroEyebrow: string;
    heroTitleFirst: string;
    heroTitleSecond: string;
    heroLead: string;
    chooseWithAi: string;
    browseCatalog: string;
    proofAria: string;
    matchesFilters: string;
    profilesInCatalog: string;
    serviceCategories: string;
    searchGeographies: string;
    categoriesAria: string;
    all: string;
    sectionEyebrow: string;
    allContractors: string;
    otherCategory: string;
    sortNote: string;
    filtersAria: string;
    emptyTitle: string;
    emptyText: string;
    resetFilters: string;
    tryAiMatch: string;
    bannerEyebrow: string;
    bannerTitle: string;
    bannerText: string;
    startMatch: string;
    footerBrand: string;
    footerNote: string;
  };
  detail: {
    backToCatalog: string;
    costFrom: string;
    formatsCount: string;
    languagesCount: string;
    upTo: string;
    hoursShort: string;
    checkForEvent: string;
    askAi: string;
    aboutEyebrow: string;
    descriptionTitle: string;
    sourceNote: string;
    calendarEyebrow: string;
    busyDates: string;
    datesCount: string;
    noBusyDates: string;
    serviceEyebrow: string;
    formats: string;
    languages: string;
    dataEyebrow: string;
    important: string;
    syntheticTitle: string;
    syntheticText: string;
    cityImputedTitle: string;
    cityImputedText: string;
    priceImputedTitle: string;
    priceImputedText: string;
    cleanDataTitle: string;
    cleanDataText: string;
  };
  errors: {
    catalogEyebrow: string;
    catalogTitle: string;
    catalogUnavailable: string;
    genericUnavailable: string;
    retry: string;
    goToAi: string;
    detailEyebrow: string;
    detailTitle: string;
    backToCatalog: string;
  };
}

export const catalogMessages = {
  ru: {
    metadata: {
      catalogTitle: "Каталог подрядчиков",
      catalogDescription:
        "66 event-подрядчиков Казахстана с фильтрами по городу, категории, формату, языку и бюджету.",
      detailTitle: "Профиль подрядчика",
      detailDescription:
        "Подробная карточка event-подрядчика и календарь занятости.",
    },
    header: {
      homeAria: "ToiMatch — каталог",
      brand: "ToiMatch",
      tagline: "умный выбор подрядчиков",
      catalog: "Каталог",
      match: "Подбор",
      assistant: "AI-ассистент",
      jury: "Для жюри",
      chooseWithAi: "Подобрать с AI",
      localeAria: "Выбрать язык интерфейса",
      navigationAria: "Основная навигация",
    },
    values: {
      cities: { Алматы: "Алматы", Астана: "Астана", Зарубежье: "Зарубежье" },
      categories: {
        Ведущий: "Ведущий",
        "Ведущий церемонии": "Ведущий церемонии",
        Фотограф: "Фотограф",
        Видеограф: "Видеограф",
        Флорист: "Флорист",
        Декоратор: "Декоратор",
        "Подарки и сувениры": "Подарки и сувениры",
        Инструменталист: "Инструменталист",
        "Лайв-бэнд": "Лайв-бэнд",
        "Национальный ансамбль": "Национальный ансамбль",
        "Танцевальный коллектив": "Танцевальный коллектив",
        "Шоу-программа": "Шоу-программа",
        "Фото и видеобудки": "Фото и видеобудки",
        "Банкетный зал": "Банкетный зал",
        Ресторан: "Ресторан",
        "Загородная площадка": "Загородная площадка",
        Отель: "Отель",
      },
      eventFormats: {
        свадьба: "свадьба",
        той: "той",
        корпоратив: "корпоратив",
        конференция: "конференция",
        юбилей: "юбилей",
        "день рождения": "день рождения",
      },
      languages: {
        русский: "русский",
        казахский: "казахский",
        английский: "английский",
      },
    },
    filters: {
      title: "Фильтры каталога",
      description: "Сузьте выбор по проверяемым параметрам профиля.",
      reset: "Сбросить",
      city: "Город",
      allCities: "Все города",
      category: "Категория",
      allCategories: "Все категории",
      eventFormat: "Формат события",
      anyFormat: "Любой формат",
      language: "Язык",
      anyLanguage: "Любой язык",
      priceFrom: "Цена от, ₸",
      priceTo: "Цена до, ₸",
      minPricePlaceholder: "0",
      maxPricePlaceholder: "1 000 000",
      submit: "Показать подрядчиков",
    },
    photo: {
      missingAlt: "Фото для {name} пока не добавлено",
      imageAlt: "{name} — {category}",
      disclosure: "Фото: ИИ-иллюстрация",
      contractorFallback: "Подрядчик",
    },
    card: {
      profileAria: "Открыть профиль {name}",
      priceFrom: "от",
      formats: "Форматы",
      languages: "Языки",
      duration: "Длительность",
      unlimited: "Без ограничения",
      upToHours: "до {hours} ч",
      dataAria: "Особенности данных профиля",
      synthetic: "Синтетический профиль",
      cityImputed: "Город дополнен",
      priceImputed: "Цена дополнена",
      profile: "Профиль",
      checkWithAi: "Проверить с AI",
    },
    catalog: {
      heroEyebrow: "Подрядчики для событий в Казахстане",
      heroTitleFirst: "Найдите своих.",
      heroTitleSecond: "Доверьте выбор фактам.",
      heroLead:
        "Смотрите каталог сами или опишите событие — AI проверит дату, бюджет и формат и объяснит каждый вариант.",
      chooseWithAi: "Подобрать с AI",
      browseCatalog: "Смотреть каталог",
      proofAria: "О каталоге",
      matchesFilters: "подходит под фильтры",
      profilesInCatalog: "профилей в каталоге",
      serviceCategories: "категорий услуг",
      searchGeographies: "локации",
      categoriesAria: "Категории каталога",
      all: "Все",
      sectionEyebrow: "Открытый каталог",
      allContractors: "Все подрядчики",
      otherCategory: "Другое",
      sortNote:
        "Сначала — с меньшей стартовой ценой.",
      filtersAria: "Фильтры каталога",
      emptyTitle: "По этим фильтрам никого не нашли",
      emptyText:
        "Сбросьте часть параметров или передайте задачу AI — он покажет, на каком условии отсеялись кандидаты.",
      resetFilters: "Сбросить фильтры",
      tryAiMatch: "Попробовать AI-подбор",
      bannerEyebrow: "Не хотите сравнивать вручную?",
      bannerTitle: "AI выберет до трёх и докажет каждый выбор.",
      bannerText:
        "Сначала отсеиваем по фактам, потом ранжируем и объясняем каждый выбор.",
      startMatch: "Начать подбор",
      footerBrand: "ToiMatch · HackAlem AI 2026",
      footerNote:
        "Фото подрядчиков — ИИ-иллюстрации. Профили анонимизированы.",
    },
    detail: {
      backToCatalog: "Все подрядчики",
      costFrom: "Стоимость от",
      formatsCount: "Форматов",
      languagesCount: "Языков",
      upTo: "До",
      hoursShort: "{hours} ч",
      checkForEvent: "Проверить для моего события",
      askAi: "Спросить AI",
      aboutEyebrow: "О подрядчике",
      descriptionTitle: "Описание профиля",
      sourceNote:
        "Описание — со слов подрядчика. Город, цена, форматы, языки и длительность — проверенные данные каталога.",
      calendarEyebrow: "Календарь",
      busyDates: "Занятые даты",
      datesCount: "{count} дат",
      noBusyDates: "В профиле пока нет отмеченных занятых дат.",
      serviceEyebrow: "Параметры услуги",
      formats: "Форматы",
      languages: "Языки",
      dataEyebrow: "Данные профиля",
      important: "Что важно знать",
      syntheticTitle: "Синтетический профиль",
      syntheticText:
        "Демонстрационный профиль для редкого сценария. Он явно отмечен в каталоге.",
      cityImputedTitle: "Город дополнен",
      cityImputedText: "Город дополнен при подготовке каталога — уточните у подрядчика.",
      priceImputedTitle: "Цена дополнена",
      priceImputedText:
        "Стартовая цена дополнена при подготовке каталога — уточните у подрядчика.",
      cleanDataTitle: "Данные из анкеты",
      cleanDataText: "Город и цена указаны самим подрядчиком.",
    },
    errors: {
      catalogEyebrow: "Каталог",
      catalogTitle: "Не удалось загрузить подрядчиков",
      catalogUnavailable:
        "Каталог временно недоступен. Обновите страницу через минуту.",
      genericUnavailable: "Сервис данных временно недоступен.",
      retry: "Повторить",
      goToAi: "Перейти к AI-подбору",
      detailEyebrow: "Профиль подрядчика",
      detailTitle: "Не удалось загрузить профиль",
      backToCatalog: "Вернуться в каталог",
    },
  },
  kk: {
    metadata: {
      catalogTitle: "Мердігерлер каталогы",
      catalogDescription:
        "Қазақстандағы 66 іс-шара мердігері: қала, санат, формат, тіл және бюджет бойынша сүзгілер.",
      detailTitle: "Мердігер профилі",
      detailDescription:
        "Іс-шара мердігерінің толық профилі және бос емес күндер күнтізбесі.",
    },
    header: {
      homeAria: "ToiMatch — каталог",
      brand: "ToiMatch",
      tagline: "мердігерлерді ақылды таңдау",
      catalog: "Каталог",
      match: "Іріктеу",
      assistant: "AI-көмекші",
      jury: "Қазыларға",
      chooseWithAi: "AI арқылы таңдау",
      localeAria: "Интерфейс тілін таңдау",
      navigationAria: "Негізгі навигация",
    },
    values: {
      cities: { Алматы: "Алматы", Астана: "Астана", Зарубежье: "Шетел" },
      categories: {
        Ведущий: "Жүргізуші",
        "Ведущий церемонии": "Рәсім жүргізушісі",
        Фотограф: "Фотограф",
        Видеограф: "Видеограф",
        Флорист: "Флорист",
        Декоратор: "Декоратор",
        "Подарки и сувениры": "Сыйлықтар мен кәдесыйлар",
        Инструменталист: "Аспапшы",
        "Лайв-бэнд": "Жанды топ",
        "Национальный ансамбль": "Ұлттық ансамбль",
        "Танцевальный коллектив": "Би ұжымы",
        "Шоу-программа": "Шоу-бағдарлама",
        "Фото и видеобудки": "Фото және видеобудкалар",
        "Банкетный зал": "Банкет залы",
        Ресторан: "Мейрамхана",
        "Загородная площадка": "Қала сыртындағы алаң",
        Отель: "Қонақүй",
      },
      eventFormats: {
        свадьба: "үйлену тойы",
        той: "той",
        корпоратив: "корпоратив",
        конференция: "конференция",
        юбилей: "мерейтой",
        "день рождения": "туған күн",
      },
      languages: {
        русский: "орысша",
        казахский: "қазақша",
        английский: "ағылшынша",
      },
    },
    filters: {
      title: "Каталог сүзгілері",
      description: "Профильдің тексерілетін параметрлері бойынша таңдауды тарылтыңыз.",
      reset: "Тазалау",
      city: "Қала",
      allCities: "Барлық қала",
      category: "Санат",
      allCategories: "Барлық санат",
      eventFormat: "Іс-шара форматы",
      anyFormat: "Кез келген формат",
      language: "Тіл",
      anyLanguage: "Кез келген тіл",
      priceFrom: "Бағасы, бастап ₸",
      priceTo: "Бағасы, дейін ₸",
      minPricePlaceholder: "0",
      maxPricePlaceholder: "1 000 000",
      submit: "Мердігерлерді көрсету",
    },
    photo: {
      missingAlt: "{name} үшін фото әлі қосылмаған",
      imageAlt: "{name} — {category}",
      disclosure: "Фото: AI иллюстрациясы",
      contractorFallback: "Мердігер",
    },
    card: {
      profileAria: "{name} профилін ашу",
      priceFrom: "бастап",
      formats: "Форматтар",
      languages: "Тілдер",
      duration: "Ұзақтығы",
      unlimited: "Шектеусіз",
      upToHours: "{hours} сағ дейін",
      dataAria: "Профиль деректерінің ерекшеліктері",
      synthetic: "Синтетикалық профиль",
      cityImputed: "Қала толықтырылған",
      priceImputed: "Баға толықтырылған",
      profile: "Профиль",
      checkWithAi: "AI арқылы тексеру",
    },
    catalog: {
      heroEyebrow: "Қазақстандағы іс-шара мердігерлері",
      heroTitleFirst: "Өз адамдарыңызды табыңыз.",
      heroTitleSecond: "Таңдауды деректерге сеніп тапсырыңыз.",
      heroLead:
        "Каталогты өзіңіз қараңыз немесе іс-шараны сипаттаңыз — AI күнді, бюджет пен форматты тексеріп, әр нұсқаны түсіндіреді.",
      chooseWithAi: "AI арқылы таңдау",
      browseCatalog: "Каталогты қарау",
      proofAria: "Каталог туралы",
      matchesFilters: "сүзгілерге сай келеді",
      profilesInCatalog: "каталогтағы профиль",
      serviceCategories: "қызмет санаты",
      searchGeographies: "локация",
      categoriesAria: "Каталог санаттары",
      all: "Барлығы",
      sectionEyebrow: "Ашық каталог",
      allContractors: "Барлық мердігер",
      otherCategory: "Басқа",
      sortNote:
        "Алдымен — бастапқы бағасы төмендері.",
      filtersAria: "Каталог сүзгілері",
      emptyTitle: "Бұл сүзгілер бойынша ешкім табылмады",
      emptyText:
        "Параметрлердің бір бөлігін алып тастаңыз немесе тапсырманы AI-ға беріңіз — ол үміткерлердің қай шартта алынбағанын көрсетеді.",
      resetFilters: "Сүзгілерді тазалау",
      tryAiMatch: "AI іріктеуін сынау",
      bannerEyebrow: "Қолмен салыстырғыңыз келмей ме?",
      bannerTitle: "AI үшке дейін нұсқа таңдап, әр шешімді дәлелдейді.",
      bannerText:
        "Алдымен деректер бойынша сүземіз, содан кейін рейтинг жасап, әр таңдауды түсіндіреміз.",
      startMatch: "Іріктеуді бастау",
      footerBrand: "ToiMatch · HackAlem AI 2026",
      footerNote:
        "Мердігер фотолары — AI иллюстрациялары. Профильдер анонимдендірілген.",
    },
    detail: {
      backToCatalog: "Барлық мердігер",
      costFrom: "Бастапқы құны",
      formatsCount: "Формат саны",
      languagesCount: "Тіл саны",
      upTo: "Дейін",
      hoursShort: "{hours} сағ",
      checkForEvent: "Менің іс-шарама тексеру",
      askAi: "AI-дан сұрау",
      aboutEyebrow: "Мердігер туралы",
      descriptionTitle: "Профиль сипаттамасы",
      sourceNote:
        "Сипаттама — мердігердің өз сөзі. Қала, баға, формат, тіл және ұзақтық — каталогтың тексерілген деректері.",
      calendarEyebrow: "Күнтізбе",
      busyDates: "Бос емес күндер",
      datesCount: "{count} күн",
      noBusyDates: "Профильде бос емес күндер әлі белгіленбеген.",
      serviceEyebrow: "Қызмет параметрлері",
      formats: "Форматтар",
      languages: "Тілдер",
      dataEyebrow: "Профиль деректері",
      important: "Маңызды ақпарат",
      syntheticTitle: "Синтетикалық профиль",
      syntheticText:
        "Сирек сценарийге арналған демо-профиль. Каталогта анық белгіленген.",
      cityImputedTitle: "Қала толықтырылған",
      cityImputedText: "Қала каталогты дайындау кезінде толықтырылды — мердігерден нақтылаңыз.",
      priceImputedTitle: "Баға толықтырылған",
      priceImputedText:
        "Бастапқы баға каталогты дайындау кезінде толықтырылды — мердігерден нақтылаңыз.",
      cleanDataTitle: "Деректер сауалнамадан",
      cleanDataText: "Қала мен бағаны мердігердің өзі көрсеткен.",
    },
    errors: {
      catalogEyebrow: "Каталог",
      catalogTitle: "Мердігерлерді жүктеу мүмкін болмады",
      catalogUnavailable:
        "Каталог уақытша қолжетімсіз. Бір минуттан кейін бетті жаңартыңыз.",
      genericUnavailable: "Деректер сервисі уақытша қолжетімсіз.",
      retry: "Қайталау",
      goToAi: "AI іріктеуіне өту",
      detailEyebrow: "Мердігер профилі",
      detailTitle: "Профильді жүктеу мүмкін болмады",
      backToCatalog: "Каталогқа оралу",
    },
  },
  en: {
    metadata: {
      catalogTitle: "Contractor catalog",
      catalogDescription:
        "66 event contractors in Kazakhstan with city, category, format, language, and budget filters.",
      detailTitle: "Contractor profile",
      detailDescription:
        "A detailed event contractor profile with an availability calendar.",
    },
    header: {
      homeAria: "ToiMatch — catalog",
      brand: "ToiMatch",
      tagline: "smart contractor selection",
      catalog: "Catalog",
      match: "Match",
      assistant: "AI assistant",
      jury: "For judges",
      chooseWithAi: "Match with AI",
      localeAria: "Choose interface language",
      navigationAria: "Main navigation",
    },
    values: {
      cities: { Алматы: "Almaty", Астана: "Astana", Зарубежье: "International" },
      categories: {
        Ведущий: "Host",
        "Ведущий церемонии": "Ceremony host",
        Фотограф: "Photographer",
        Видеограф: "Videographer",
        Флорист: "Florist",
        Декоратор: "Decorator",
        "Подарки и сувениры": "Gifts and souvenirs",
        Инструменталист: "Instrumentalist",
        "Лайв-бэнд": "Live band",
        "Национальный ансамбль": "National ensemble",
        "Танцевальный коллектив": "Dance group",
        "Шоу-программа": "Show program",
        "Фото и видеобудки": "Photo and video booths",
        "Банкетный зал": "Banquet hall",
        Ресторан: "Restaurant",
        "Загородная площадка": "Country venue",
        Отель: "Hotel",
      },
      eventFormats: {
        свадьба: "wedding",
        той: "toi",
        корпоратив: "corporate event",
        конференция: "conference",
        юбилей: "anniversary",
        "день рождения": "birthday",
      },
      languages: {
        русский: "Russian",
        казахский: "Kazakh",
        английский: "English",
      },
    },
    filters: {
      title: "Catalog filters",
      description: "Narrow the list using verifiable profile attributes.",
      reset: "Reset",
      city: "City",
      allCities: "All cities",
      category: "Category",
      allCategories: "All categories",
      eventFormat: "Event format",
      anyFormat: "Any format",
      language: "Language",
      anyLanguage: "Any language",
      priceFrom: "Price from, ₸",
      priceTo: "Price to, ₸",
      minPricePlaceholder: "0",
      maxPricePlaceholder: "1,000,000",
      submit: "Show contractors",
    },
    photo: {
      missingAlt: "A photo for {name} has not been added yet",
      imageAlt: "{name} — {category}",
      disclosure: "Image: AI illustration",
      contractorFallback: "Contractor",
    },
    card: {
      profileAria: "Open {name}'s profile",
      priceFrom: "from",
      formats: "Formats",
      languages: "Languages",
      duration: "Duration",
      unlimited: "No limit",
      upToHours: "up to {hours} h",
      dataAria: "Profile data notes",
      synthetic: "Synthetic profile",
      cityImputed: "City inferred",
      priceImputed: "Price inferred",
      profile: "Profile",
      checkWithAi: "Check with AI",
    },
    catalog: {
      heroEyebrow: "Event contractors in Kazakhstan",
      heroTitleFirst: "Find your team.",
      heroTitleSecond: "Trust the facts.",
      heroLead:
        "Browse the catalog yourself or describe your event — AI checks the date, budget and format and explains every option.",
      chooseWithAi: "Match with AI",
      browseCatalog: "Browse catalog",
      proofAria: "About the catalog",
      matchesFilters: "match the filters",
      profilesInCatalog: "profiles in the catalog",
      serviceCategories: "service categories",
      searchGeographies: "locations",
      categoriesAria: "Catalog categories",
      all: "All",
      sectionEyebrow: "Open catalog",
      allContractors: "All contractors",
      otherCategory: "Other",
      sortNote:
        "Lowest starting price first.",
      filtersAria: "Catalog filters",
      emptyTitle: "No one matches these filters",
      emptyText:
        "Remove some parameters or let AI handle the task — it will show which condition filtered each candidate out.",
      resetFilters: "Reset filters",
      tryAiMatch: "Try AI matching",
      bannerEyebrow: "Do not want to compare manually?",
      bannerTitle: "AI will select up to three and prove every choice.",
      bannerText:
        "We filter by facts first, then rank and explain every choice.",
      startMatch: "Start matching",
      footerBrand: "ToiMatch · HackAlem AI 2026",
      footerNote:
        "Contractor images are AI illustrations. Profiles are anonymized.",
    },
    detail: {
      backToCatalog: "All contractors",
      costFrom: "Price from",
      formatsCount: "Formats",
      languagesCount: "Languages",
      upTo: "Up to",
      hoursShort: "{hours} h",
      checkForEvent: "Check for my event",
      askAi: "Ask AI",
      aboutEyebrow: "About the contractor",
      descriptionTitle: "Profile description",
      sourceNote:
        "The description is in the contractor's own words. City, price, formats, languages and duration are verified catalog data.",
      calendarEyebrow: "Calendar",
      busyDates: "Busy dates",
      datesCount: "{count} dates",
      noBusyDates: "No busy dates are marked in this profile yet.",
      serviceEyebrow: "Service attributes",
      formats: "Formats",
      languages: "Languages",
      dataEyebrow: "Profile data",
      important: "What to know",
      syntheticTitle: "Synthetic profile",
      syntheticText:
        "A demo profile for a rare scenario. It is clearly marked in the catalog.",
      cityImputedTitle: "City inferred",
      cityImputedText: "The city was filled in while preparing the catalog — confirm it with the contractor.",
      priceImputedTitle: "Price inferred",
      priceImputedText:
        "The starting price was filled in while preparing the catalog — confirm it with the contractor.",
      cleanDataTitle: "Straight from the profile",
      cleanDataText: "The city and price were provided by the contractor.",
    },
    errors: {
      catalogEyebrow: "Catalog",
      catalogTitle: "Could not load contractors",
      catalogUnavailable:
        "The catalog is temporarily unavailable. Please refresh the page in a minute.",
      genericUnavailable: "The data service is temporarily unavailable.",
      retry: "Try again",
      goToAi: "Go to AI matching",
      detailEyebrow: "Contractor profile",
      detailTitle: "Could not load the profile",
      backToCatalog: "Back to catalog",
    },
  },
} satisfies Record<Locale, CatalogMessages>;
