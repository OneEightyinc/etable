export type Lang = "ja" | "en" | "ko" | "zh" | "es";

export type KioskCopy = {
  heading: string;
  waitLabel: string;
  estimateLabel: string;
  groupUnit: string;
  minuteUnit: string;
  cancel: string;
  ok: string;
  peopleHeading: string;
  peopleUnit: string;
  peopleNote: string;
  back: string;
  next: string;
  seatHeading: string;
  seatTable: string;
  seatCounter: string;
  seatEither: string;
  noticeHeading: string;
  noticeLines: string[];
  noticeFooter: string;
  noticeAgree: string;
  entry: string;
  autoBack: string;
  phonePlaceholder: string;
};

export const translations: Record<Lang, KioskCopy> = {
  ja: {
    heading: "呼び出し用の電話番号を入力してください。",
    waitLabel: "現在の待ち組数",
    estimateLabel: "目安待ち時間：約",
    groupUnit: "組",
    minuteUnit: "分",
    cancel: "キャンセル",
    ok: "OK",
    peopleHeading: "人数を入力してください",
    peopleUnit: "名様",
    peopleNote: "※お子様も人数に含めてください",
    back: "戻る",
    next: "次へ",
    seatHeading: "席の種類を選んでください",
    seatTable: "テーブル席",
    seatCounter: "カウンター席",
    seatEither: "どちらでもない",
    noticeHeading: "注意事項",
    noticeLines: [
      "週末・祝日はディナーのみのご提供です。",
      "5 名以上の団体様は席が分かれる場合がございます。",
      "混雑時は 90 分制とさせていただきます。",
      "他店舗様の前での待機はご遠慮ください。"
    ],
    noticeFooter: "ご理解の程よろしくお願いいたします。",
    noticeAgree: "同意する",
    entry: "ENTRY NUMBER",
    autoBack: "3秒後に自動で戻ります",
    phonePlaceholder: "PLEASE ENTER YOUR PHONE NUMBER"
  },
  en: {
    heading: "Please enter\nyour phone number.",
    waitLabel: "Current waiting parties",
    estimateLabel: "Estimated waiting time: ",
    groupUnit: "groups",
    minuteUnit: "min",
    cancel: "Cancel",
    ok: "OK",
    peopleHeading: "Please enter number of guests",
    peopleUnit: "guests",
    peopleNote: "Please include children in the total.",
    back: "Back",
    next: "Next",
    seatHeading: "Please select your seating",
    seatTable: "Table",
    seatCounter: "Counter",
    seatEither: "No preference",
    noticeHeading: "Important information",
    noticeLines: [
      "On weekends and holidays we only serve dinner.",
      "For groups of 5 or more, your party may be split.",
      "During busy times, seating is limited to 90 minutes.",
      "Please avoid waiting in front of other stores."
    ],
    noticeFooter: "Thank you for your understanding.",
    noticeAgree: "Agree",
    entry: "ENTRY NUMBER",
    autoBack: "Auto return in 3 seconds",
    phonePlaceholder: "PLEASE ENTER YOUR PHONE NUMBER"
  },
  ko: {
    heading: "호출용 전화번호를\n입력해 주세요.",
    waitLabel: "현재 대기 팀 수",
    estimateLabel: "예상 대기 시간: ",
    groupUnit: "팀",
    minuteUnit: "분",
    cancel: "취소",
    ok: "확인",
    peopleHeading: "인원을 입력해 주세요",
    peopleUnit: "명",
    peopleNote: "어린이도 인원에 포함해 주세요.",
    back: "뒤로",
    next: "다음",
    seatHeading: "좌석 유형을 선택해 주세요",
    seatTable: "테이블석",
    seatCounter: "카운터석",
    seatEither: "상관없음",
    noticeHeading: "주의사항",
    noticeLines: [
      "주말·공휴일에는 디너 시간만 운영합니다.",
      "5명 이상의 단체 손님은 자리가 나뉠 수 있습니다.",
      "혼잡 시에는 90분제 한정으로 이용 부탁드립니다.",
      "다른 매장 앞에서의 대기는 삼가해 주세요."
    ],
    noticeFooter: "양해 부탁드립니다.",
    noticeAgree: "동의하기",
    entry: "ENTRY NUMBER",
    autoBack: "3초 후 자동으로 돌아갑니다",
    phonePlaceholder: "PLEASE ENTER YOUR PHONE NUMBER"
  },
  zh: {
    heading: "请输入用于呼叫的\n手机号。",
    waitLabel: "当前等候组数",
    estimateLabel: "预计等待时间：",
    groupUnit: "组",
    minuteUnit: "分",
    cancel: "取消",
    ok: "确定",
    peopleHeading: "请输入人数",
    peopleUnit: "人",
    peopleNote: "请包含儿童人数。",
    back: "返回",
    next: "下一步",
    seatHeading: "请选择座位类型",
    seatTable: "桌位",
    seatCounter: "吧台位",
    seatEither: "不限",
    noticeHeading: "注意事项",
    noticeLines: [
      "周末及节假日仅提供晚餐服务。",
      "5人以上的团体有可能需要分桌入座。",
      "繁忙时段用餐时间限制为90分钟。",
      "请避免在其他店铺门前等候。"
    ],
    noticeFooter: "感谢您的理解与配合。",
    noticeAgree: "同意",
    entry: "ENTRY NUMBER",
    autoBack: "3秒后自动返回",
    phonePlaceholder: "PLEASE ENTER YOUR PHONE NUMBER"
  },
  es: {
    heading: "Por favor ingrese\nsu número de teléfono.",
    waitLabel: "Número de grupos en espera",
    estimateLabel: "Tiempo de espera estimado: ",
    groupUnit: "grupos",
    minuteUnit: "min",
    cancel: "Cancelar",
    ok: "OK",
    peopleHeading: "Por favor ingrese el número de personas",
    peopleUnit: "personas",
    peopleNote: "Incluya a los niños en el total.",
    back: "Atrás",
    next: "Siguiente",
    seatHeading: "Por favor seleccione el tipo de asiento",
    seatTable: "Mesa",
    seatCounter: "Barra",
    seatEither: "Sin preferencia",
    noticeHeading: "Aviso importante",
    noticeLines: [
      "Los fines de semana y festivos solo servimos cena.",
      "Para grupos de 5 personas o más, es posible que se dividan las mesas.",
      "En horas punta el tiempo de uso se limita a 90 minutos.",
      "Por favor evite esperar frente a otros locales."
    ],
    noticeFooter: "Gracias por su comprensión.",
    noticeAgree: "Aceptar",
    entry: "ENTRY NUMBER",
    autoBack: "Regresa automáticamente en 3 segundos",
    phonePlaceholder: "PLEASE ENTER YOUR PHONE NUMBER"
  }
};
