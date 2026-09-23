import type { Locale } from "../../../../shared/contract";
import type { MatchMessages } from "./match";
import { MATCH_MESSAGES } from "./match";

export type ChatField =
  | "category"
  | "city"
  | "date"
  | "eventType"
  | "budgetKzt"
  | "language";

interface FieldCopy {
  label: string;
  prompt: string;
  placeholder: string;
}

export interface ChatMessages {
  pageTitle: string;
  pageDescription: string;
  brand: string;
  brandAria: string;
  navigationAria: string;
  nav: {
    catalog: string;
    match: string;
    chat: string;
    manager: string;
  };
  localeLabel: string;
  skip: string;
  hero: {
    eyebrow: string;
    title: string;
    accent: string;
    description: string;
    badge: string;
  };
  fields: Record<ChatField, FieldCopy>;
  progress: {
    eyebrow: string;
    title: string;
    complete: string;
    pending: string;
    edit: string;
    optional: string;
    note: string;
  };
  mode: {
    search: string;
    bundle: string;
    label: string;
  };
  examples: Record<"search" | "bundle", readonly { label: string; value: string; displayValue: string }[]>;
  tools: {
    searching: string;
    bundle: string;
    estimating: string;
  };
  bundle: {
    eyebrow: string;
    title: string;
    required: string;
    recommended: string;
    allocation: string;
    none: string;
  };
  assistant: {
    name: string;
    label: string;
    greeting: string;
    transparency: string;
    understood: string;
    changed: string;
    searching: string;
    resultReady: string;
    noRecognition: string;
    invalidDate: string;
    invalidBudget: string;
    restarted: string;
    error: string;
    connecting: string;
    sessionError: string;
  };
  composer: {
    label: string;
    send: string;
    sending: string;
    hint: string;
    placeholder: string;
  };
  actions: {
    anyLanguage: string;
    restart: string;
    change: string;
    retry: string;
  };
  result: {
    photo: string;
    photoMissing: string;
    eyebrow: string;
    criteria: string;
    cards: string;
    facts: string;
    verified: string;
    claimed: string;
    from: string;
    outcome: Record<"found" | "no_category_in_city" | "all_filtered_out", string>;
    emptyHint: string;
    flags: {
      synthetic: string;
      priceImputed: string;
      cityImputed: string;
    };
  };
  labels: Pick<MatchMessages, "categories" | "cities" | "eventFormats" | "languages">;
  quickDates: readonly { label: string; value: string }[];
  quickBudgets: readonly { label: string; value: string }[];
}

const messages = {
  ru: {
    pageTitle: "ToiMatch — ассистент подбора",
    pageDescription:
      "Диалоговый помощник собирает параметры события и запускает проверяемый подбор подрядчиков.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — каталог подрядчиков",
    navigationAria: "Основная навигация",
    nav: { catalog: "Каталог", match: "AI-подбор", chat: "AI-чат", manager: "Для жюри" },
    localeLabel: "Язык интерфейса",
    skip: "Перейти к диалогу",
    hero: {
      eyebrow: "Диалоговый подбор",
      title: "Опишите событие.",
      accent: "Остальное соберём вместе.",
      description:
        "Опишите заказ в свободной форме: ассистент уточнит недостающее и покажет проверяемый подбор или пакет подрядчиков.",
      badge: "Работает на matching engine",
    },
    fields: {
      category: {
        label: "Категория",
        prompt: "Кого ищем? Напишите категорию или выберите один из вариантов.",
        placeholder: "Например, ведущий или фотограф",
      },
      city: {
        label: "Город",
        prompt: "В каком городе пройдёт событие?",
        placeholder: "Например, Алматы",
      },
      date: {
        label: "Дата",
        prompt: "На какую дату нужен подрядчик? Можно написать 16.10 или 2026-10-16.",
        placeholder: "ДД.ММ или ГГГГ-ММ-ДД",
      },
      eventType: {
        label: "Формат",
        prompt: "Какой формат у события?",
        placeholder: "Например, корпоратив",
      },
      budgetKzt: {
        label: "Бюджет",
        prompt: "Какой бюджет заложен на подрядчика?",
        placeholder: "Например, 1 000 000 ₸",
      },
      language: {
        label: "Язык",
        prompt: "Нужен определённый язык подрядчика? Этот шаг можно пропустить.",
        placeholder: "Русский, казахский, английский или любой",
      },
    },
    progress: {
      eyebrow: "Подсказка из диалога",
      title: "Упомянутые условия",
      complete: "Заполнено",
      pending: "Ждёт ответа",
      edit: "Изменить",
      optional: "необязательно",
      note: "Это подсказка из ваших сообщений. Окончательные условия и результаты определяет backend.",
    },
    mode: { search: "Один подрядчик", bundle: "Пакет мероприятия", label: "Режим ассистента" },
    examples: {
      search: [
        { label: "Ведущий · корпоратив · Алматы", value: "Нужен Ведущий в Алматы на корпоратив 2026-10-16, бюджет 1000000 ₸", displayValue: "Нужен ведущий в Алматы на корпоратив 16.10.2026, бюджет 1 000 000 ₸." },
        { label: "Флорист · свадьба · Алматы", value: "Нужен Флорист в Алматы на свадьба 2026-10-15, бюджет 300000 ₸", displayValue: "Нужен флорист в Алматы на свадьбу 15.10.2026, бюджет 300 000 ₸." },
      ],
      bundle: [
        { label: "Свадьба · Алматы", value: "Собери полный пакет на свадьба в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "Собери полный пакет на свадьбу в Алматы 16.10.2026, бюджет 5 000 000 ₸." },
        { label: "Корпоратив · Алматы", value: "Собери полный пакет на корпоратив в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "Собери полный пакет на корпоратив в Алматы 16.10.2026, бюджет 5 000 000 ₸." },
      ],
    },
    tools: {
      searching: "Ищу подрядчиков и проверяю факты…",
      bundle: "Собираю пакет по категориям…",
      estimating: "Оцениваю минимальный бюджет пакета…",
    },
    bundle: {
      eyebrow: "Ответ ассистента",
      title: "Пакет мероприятия",
      required: "Обязательные категории",
      recommended: "Дополнительные категории",
      allocation: "Бюджет",
      none: "Категории не добавлены.",
    },
    assistant: {
      name: "Ассистент ToiMatch",
      label: "Помощник",
      greeting:
        "Здравствуйте! Я помогу сформировать точный запрос и найти подходящих подрядчиков.",
      transparency:
        "Ассистент уточняет запрос, а карточки и факты берёт из каталога через matching engine.",
      understood: "Принято. Зафиксировал параметры и двигаюсь дальше.",
      changed: "Параметр обновлён. Пересчитываю подбор по новым условиям.",
      searching: "Запрос готов. Проверяю город, дату, формат, бюджет и язык…",
      resultReady: "Проверка завершена. Ниже — ответ matching engine и факты по кандидатам.",
      noRecognition: "Не смог распознать ответ. Используйте подсказку или один из готовых вариантов.",
      invalidDate: "Не удалось распознать дату. Напишите её как 16.10 или 2026-10-16.",
      invalidBudget: "Не удалось распознать бюджет. Например: 300 000 ₸ или 1 млн.",
      restarted: "Начнём заново. Сначала определим, какой подрядчик нужен.",
      error: "Подбор сейчас не завершился. Проверьте, запущен ли backend, и повторите попытку.",
      connecting: "Открываю диалог с ассистентом…",
      sessionError: "Не удалось открыть диалог. Проверьте подключение к backend и попробуйте снова.",
    },
    composer: {
      label: "Ваш ответ",
      send: "Отправить",
      sending: "Проверяем…",
      hint: "Напишите свободно или нажмите пример. Для точного результата укажите город, дату, формат и бюджет.",
      placeholder: "Расскажите о мероприятии или задайте вопрос",
    },
    actions: {
      anyLanguage: "Любой язык",
      restart: "Начать заново",
      change: "Изменить условия",
      retry: "Отправить снова",
    },
    result: {
      photo: "Фото: ИИ-иллюстрация", photoMissing: "Фото недоступно",
      eyebrow: "Ответ matching engine",
      criteria: "На что смотреть",
      cards: "Подходящие подрядчики",
      facts: "Факты выбора",
      verified: "проверено",
      claimed: "со слов подрядчика",
      from: "от",
      outcome: {
        found: "Варианты найдены",
        no_category_in_city: "Категории нет в городе",
        all_filtered_out: "Все кандидаты отсеяны",
      },
      emptyHint: "Измените один из параметров — помощник запустит проверку снова.",
      flags: {
        synthetic: "синтетический профиль",
        priceImputed: "цена дополнена",
        cityImputed: "город дополнен",
      },
    },
    labels: {
      categories: MATCH_MESSAGES.ru.categories,
      cities: MATCH_MESSAGES.ru.cities,
      eventFormats: MATCH_MESSAGES.ru.eventFormats,
      languages: MATCH_MESSAGES.ru.languages,
    },
    quickDates: [
      { label: "16 октября", value: "2026-10-16" },
      { label: "23 октября", value: "2026-10-23" },
      { label: "14 ноября", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "300 000 ₸", value: "300000" },
      { label: "1 000 000 ₸", value: "1000000" },
      { label: "1 500 000 ₸", value: "1500000" },
    ],
  },
  kk: {
    pageTitle: "ToiMatch — таңдау көмекшісі",
    pageDescription:
      "Диалог көмекшісі іс-шара параметрлерін жинап, мердігерлерді тексерілетін іріктеуді іске қосады.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — мердігерлер каталогы",
    navigationAria: "Негізгі навигация",
    nav: { catalog: "Каталог", match: "AI-таңдау", chat: "AI-чат", manager: "Қазыларға" },
    localeLabel: "Интерфейс тілі",
    skip: "Диалогқа өту",
    hero: {
      eyebrow: "Диалог арқылы таңдау",
      title: "Іс-шараны сипаттаңыз.",
      accent: "Қалғанын бірге жинаймыз.",
      description:
        "Тапсырысты еркін сипаттаңыз: көмекші қажет мәліметті нақтылап, тексерілетін таңдау немесе мердігерлер пакетін көрсетеді.",
      badge: "Matching engine арқылы жұмыс істейді",
    },
    fields: {
      category: {
        label: "Санат",
        prompt: "Кімді іздейміз? Санатты жазыңыз немесе нұсқаны таңдаңыз.",
        placeholder: "Мысалы, жүргізуші немесе фотограф",
      },
      city: {
        label: "Қала",
        prompt: "Іс-шара қай қалада өтеді?",
        placeholder: "Мысалы, Алматы",
      },
      date: {
        label: "Күні",
        prompt: "Мердігер қай күнге қажет? 16.10 немесе 2026-10-16 деп жаза аласыз.",
        placeholder: "КК.АА немесе ЖЖЖЖ-АА-КК",
      },
      eventType: {
        label: "Формат",
        prompt: "Іс-шараның форматы қандай?",
        placeholder: "Мысалы, корпоратив",
      },
      budgetKzt: {
        label: "Бюджет",
        prompt: "Мердігерге қандай бюджет қарастырылған?",
        placeholder: "Мысалы, 1 000 000 ₸",
      },
      language: {
        label: "Тіл",
        prompt: "Мердігердің нақты тілі қажет пе? Бұл қадамды өткізуге болады.",
        placeholder: "Қазақша, орысша, ағылшынша немесе кез келген",
      },
    },
    progress: {
      eyebrow: "Диалогтан алынған мәлімет",
      title: "Аталған шарттар",
      complete: "Толтырылды",
      pending: "Жауап күтуде",
      edit: "Өзгерту",
      optional: "міндетті емес",
      note: "Бұл — хабарламаларыңыздан алынған көмекші мәлімет. Соңғы шарттар мен нәтижені backend анықтайды.",
    },
    mode: { search: "Бір мердігер", bundle: "Іс-шара пакеті", label: "Көмекші режимі" },
    examples: {
      search: [
        { label: "Жүргізуші · корпоратив · Алматы", value: "Нужен Ведущий в Алматы на корпоратив 2026-10-16, бюджет 1000000 ₸", displayValue: "2026 жылғы 16 қазанда Алматыдағы корпоративке жүргізуші керек. Бюджет: 1 000 000 ₸." },
        { label: "Флорист · үйлену тойы · Алматы", value: "Нужен Флорист в Алматы на свадьба 2026-10-15, бюджет 300000 ₸", displayValue: "2026 жылғы 15 қазанда Алматыдағы үйлену тойына флорист керек. Бюджет: 300 000 ₸." },
      ],
      bundle: [
        { label: "Үйлену тойы · Алматы", value: "Собери полный пакет на свадьба в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "2026 жылғы 16 қазанда Алматыдағы үйлену тойына толық пакет құрастыр. Бюджет: 5 000 000 ₸." },
        { label: "Корпоратив · Алматы", value: "Собери полный пакет на корпоратив в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "2026 жылғы 16 қазанда Алматыдағы корпоративке толық пакет құрастыр. Бюджет: 5 000 000 ₸." },
      ],
    },
    tools: {
      searching: "Мердігерлерді іздеп, деректерді тексеремін…",
      bundle: "Санаттар бойынша пакет құрастырамын…",
      estimating: "Пакеттің ең аз бюджетін есептеймін…",
    },
    bundle: {
      eyebrow: "Көмекшінің жауабы",
      title: "Іс-шара пакеті",
      required: "Міндетті санаттар",
      recommended: "Қосымша санаттар",
      allocation: "Бюджет",
      none: "Санаттар қосылмады.",
    },
    assistant: {
      name: "ToiMatch көмекшісі",
      label: "Көмекші",
      greeting:
        "Сәлеметсіз бе! Нақты сұраныс құрып, сәйкес мердігерлерді табуға көмектесемін.",
      transparency:
        "Көмекші сұранысты нақтылайды, ал карточкалар мен деректерді каталогтан matching engine арқылы алады.",
      understood: "Қабылданды. Параметрлерді белгілеп, келесі қадамға өтемін.",
      changed: "Параметр жаңартылды. Жаңа шарттар бойынша таңдауды қайта есептеймін.",
      searching: "Сұраныс дайын. Қаланы, күнді, форматты, бюджетті және тілді тексеремін…",
      resultReady: "Тексеру аяқталды. Төменде matching engine жауабы мен үміткер деректері берілген.",
      noRecognition: "Жауапты тани алмадым. Кеңесті немесе дайын нұсқаны пайдаланыңыз.",
      invalidDate: "Күнді тани алмадым. 16.10 немесе 2026-10-16 түрінде жазыңыз.",
      invalidBudget: "Бюджетті тани алмадым. Мысалы: 300 000 ₸ немесе 1 млн.",
      restarted: "Қайта бастайық. Алдымен қандай мердігер қажет екенін анықтаймыз.",
      error: "Таңдау аяқталмады. Backend іске қосылғанын тексеріп, қайта көріңіз.",
      connecting: "Көмекшімен диалог ашылып жатыр…",
      sessionError: "Диалог ашылмады. Backend байланысын тексеріп, қайта көріңіз.",
    },
    composer: {
      label: "Сіздің жауабыңыз",
      send: "Жіберу",
      sending: "Тексерудеміз…",
      hint: "Еркін жазыңыз немесе мысалды таңдаңыз. Нақты нәтиже үшін қала, күн, формат пен бюджетті көрсетіңіз.",
      placeholder: "Іс-шараны сипаттаңыз немесе сұрақ қойыңыз",
    },
    actions: {
      anyLanguage: "Кез келген тіл",
      restart: "Қайта бастау",
      change: "Шарттарды өзгерту",
      retry: "Қайта жіберу",
    },
    result: {
      photo: "Фото: ЖИ иллюстрациясы", photoMissing: "Фото қолжетімсіз",
      eyebrow: "Matching engine жауабы",
      criteria: "Неге назар аудару керек",
      cards: "Сәйкес мердігерлер",
      facts: "Таңдау деректері",
      verified: "тексерілді",
      claimed: "мердігердің айтуынша",
      from: "бастап",
      outcome: {
        found: "Нұсқалар табылды",
        no_category_in_city: "Қалада бұл санат жоқ",
        all_filtered_out: "Барлық үміткер сүзілді",
      },
      emptyHint: "Параметрлердің бірін өзгертіңіз — көмекші тексеруді қайта іске қосады.",
      flags: {
        synthetic: "синтетикалық профиль",
        priceImputed: "баға толықтырылған",
        cityImputed: "қала толықтырылған",
      },
    },
    labels: {
      categories: MATCH_MESSAGES.kk.categories,
      cities: MATCH_MESSAGES.kk.cities,
      eventFormats: MATCH_MESSAGES.kk.eventFormats,
      languages: MATCH_MESSAGES.kk.languages,
    },
    quickDates: [
      { label: "16 қазан", value: "2026-10-16" },
      { label: "23 қазан", value: "2026-10-23" },
      { label: "14 қараша", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "300 000 ₸", value: "300000" },
      { label: "1 000 000 ₸", value: "1000000" },
      { label: "1 500 000 ₸", value: "1500000" },
    ],
  },
  en: {
    pageTitle: "ToiMatch — matching assistant",
    pageDescription:
      "A conversational assistant collects event details and runs a verifiable contractor match.",
    brand: "ToiMatch",
    brandAria: "ToiMatch — contractor catalog",
    navigationAria: "Primary navigation",
    nav: { catalog: "Catalog", match: "AI match", chat: "AI chat", manager: "For judges" },
    localeLabel: "Interface language",
    skip: "Skip to conversation",
    hero: {
      eyebrow: "Conversational matching",
      title: "Describe your event.",
      accent: "We will shape the rest together.",
      description:
        "Describe your request freely: the assistant will ask for missing details and show a verifiable match or event bundle.",
      badge: "Powered by the matching engine",
    },
    fields: {
      category: {
        label: "Category",
        prompt: "Who are you looking for? Type a category or choose an option.",
        placeholder: "For example, host or photographer",
      },
      city: {
        label: "City",
        prompt: "Which city is the event in?",
        placeholder: "For example, Almaty",
      },
      date: {
        label: "Date",
        prompt: "What date do you need the contractor? You can type 16.10 or 2026-10-16.",
        placeholder: "DD.MM or YYYY-MM-DD",
      },
      eventType: {
        label: "Format",
        prompt: "What type of event is it?",
        placeholder: "For example, corporate event",
      },
      budgetKzt: {
        label: "Budget",
        prompt: "What is the contractor budget?",
        placeholder: "For example, 1,000,000 ₸",
      },
      language: {
        label: "Language",
        prompt: "Do you need a specific contractor language? You may skip this step.",
        placeholder: "Russian, Kazakh, English or any",
      },
    },
    progress: {
      eyebrow: "Clues from the conversation",
      title: "Details mentioned",
      complete: "Completed",
      pending: "Waiting for answer",
      edit: "Edit",
      optional: "optional",
      note: "This is a hint extracted from your messages. The backend determines the final request and results.",
    },
    mode: { search: "One contractor", bundle: "Event bundle", label: "Assistant mode" },
    examples: {
      search: [
        { label: "Host · corporate · Almaty", value: "Нужен Ведущий в Алматы на корпоратив 2026-10-16, бюджет 1000000 ₸", displayValue: "I need a host in Almaty for a corporate event on 16 October 2026. Budget: ₸1,000,000." },
        { label: "Florist · wedding · Almaty", value: "Нужен Флорист в Алматы на свадьба 2026-10-15, бюджет 300000 ₸", displayValue: "I need a florist in Almaty for a wedding on 15 October 2026. Budget: ₸300,000." },
      ],
      bundle: [
        { label: "Wedding · Almaty", value: "Собери полный пакет на свадьба в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "Build a full wedding bundle in Almaty for 16 October 2026. Budget: ₸5,000,000." },
        { label: "Corporate · Almaty", value: "Собери полный пакет на корпоратив в Алматы 2026-10-16, бюджет 5000000 ₸", displayValue: "Build a full corporate event bundle in Almaty for 16 October 2026. Budget: ₸5,000,000." },
      ],
    },
    tools: {
      searching: "Searching contractors and checking facts…",
      bundle: "Assembling the bundle by category…",
      estimating: "Estimating the bundle minimum budget…",
    },
    bundle: {
      eyebrow: "Assistant response",
      title: "Event bundle",
      required: "Required categories",
      recommended: "Additional categories",
      allocation: "Budget",
      none: "No categories added.",
    },
    assistant: {
      name: "ToiMatch assistant",
      label: "Assistant",
      greeting:
        "Hello! I will help shape a precise request and find suitable contractors.",
      transparency:
        "The assistant clarifies your request, while cards and facts come from the catalog through the matching engine.",
      understood: "Got it. I have saved those details and will move to the next step.",
      changed: "That detail is updated. I will recalculate the match using the new conditions.",
      searching: "The request is ready. Checking city, date, format, budget and language…",
      resultReady: "The check is complete. Below is the matching engine response and candidate evidence.",
      noRecognition: "I could not recognise that answer. Use the hint or choose one of the options.",
      invalidDate: "I could not recognise the date. Type it as 16.10 or 2026-10-16.",
      invalidBudget: "I could not recognise the budget. For example: 300,000 ₸ or 1 million.",
      restarted: "Let us start again. First, we will identify the contractor category.",
      error: "Matching did not finish. Check that the backend is running and try again.",
      connecting: "Opening a conversation with the assistant…",
      sessionError: "The conversation could not be opened. Check the backend connection and try again.",
    },
    composer: {
      label: "Your answer",
      send: "Send",
      sending: "Checking…",
      hint: "Write freely or choose an example. Include city, date, event type and budget for a precise result.",
      placeholder: "Describe your event or ask a question",
    },
    actions: {
      anyLanguage: "Any language",
      restart: "Start over",
      change: "Change details",
      retry: "Send again",
    },
    result: {
      photo: "Photo: AI illustration", photoMissing: "Photo unavailable",
      eyebrow: "Matching engine response",
      criteria: "What to look for",
      cards: "Suitable contractors",
      facts: "Selection evidence",
      verified: "verified",
      claimed: "according to contractor",
      from: "from",
      outcome: {
        found: "Options found",
        no_category_in_city: "Category unavailable in this city",
        all_filtered_out: "All candidates were filtered out",
      },
      emptyHint: "Change one detail and the assistant will run the check again.",
      flags: {
        synthetic: "synthetic profile",
        priceImputed: "price imputed",
        cityImputed: "city imputed",
      },
    },
    labels: {
      categories: MATCH_MESSAGES.en.categories,
      cities: MATCH_MESSAGES.en.cities,
      eventFormats: MATCH_MESSAGES.en.eventFormats,
      languages: MATCH_MESSAGES.en.languages,
    },
    quickDates: [
      { label: "16 October", value: "2026-10-16" },
      { label: "23 October", value: "2026-10-23" },
      { label: "14 November", value: "2026-11-14" },
    ],
    quickBudgets: [
      { label: "₸300,000", value: "300000" },
      { label: "₸1,000,000", value: "1000000" },
      { label: "₸1,500,000", value: "1500000" },
    ],
  },
} satisfies Record<Locale, ChatMessages>;

export const CHAT_MESSAGES: Record<Locale, ChatMessages> = messages;
