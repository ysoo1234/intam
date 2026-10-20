import type { EthicsCategory, EthicsReviewCase, EthicsVerdict, EthicsVisitor } from "../model/types";

const form = (
  id: string, category: EthicsCategory, verdict: EthicsVerdict,
  prompt: string, explanation: string,
): EthicsReviewCase => ({ id, category, verdict, prompt, explanation });

/**
 * Forms follow the five "AI 사용 약속" of the textbook (퀘스트 5, 정리 55쪽):
 * 사용 연령 · AI 도움 표시 · 개인 정보 · 고운 말 · 로그아웃.
 * Situations come from textbook activities (캔바 영상·그림, 사진 속 사람 지우기,
 * AI 스피커, 발표 자료 …). Reject forms are honest mistakes, not mischief.
 */
export const ETHICS_PRACTICE_CASE = form(
  "practice-label-picture", "label", "approve",
  "AI가 만든 그림에\n'AI가 만든 그림'이라고 적었어요.",
  "AI가 만든 결과물에는 꼭 표시를 해요.",
);

export const ETHICS_REVIEW_CASES: readonly EthicsReviewCase[] = [
  // 개인 정보 보호 (사진 속 얼굴·이름·주소·전화번호, 정보의 주인에게 허락받기)
  form("photo-permission", "privacy", "approve",
    "AI 초대장에 친구 사진을 넣기 전에\n친구에게 허락을 받았어요.",
    "다른 사람의 사진은 먼저 허락을 받고 써요."),
  form("erase-passersby", "privacy", "approve",
    "사진 속 지나가는 사람들을\nAI로 지운 뒤 사용했어요.",
    "다른 사람의 얼굴도 소중한 개인 정보예요."),
  form("no-friend-name", "privacy", "approve",
    "AI에게 축하 그림을 부탁할 때\n친구 이름은 넣지 않았어요.",
    "AI에는 꼭 필요한 내용만 입력해요."),
  form("hide-car-number", "privacy", "approve",
    "학교 앞 사진을 AI에 올리기 전에\n자동차 번호판을 가렸어요.",
    "자동차 번호판도 지켜야 할 개인 정보예요."),
  form("share-address", "privacy", "reject",
    "AI가 물어봐서 우리 집 주소와\n전화번호를 알려 줬어요.",
    "주소와 전화번호는 AI에 입력하지 않아요."),
  form("photo-no-permission", "privacy", "reject",
    "친구 사진이 잘 나와서\n물어보지 않고 AI 영상에 넣었어요.",
    "친구 사진을 쓰기 전에 먼저 물어봐요."),
  form("share-phone-numbers", "privacy", "reject",
    "AI로 모둠 소개 영상을 만들며\n친구들 전화번호까지 넣었어요.",
    "꼭 필요한 내용만 넣고 개인 정보는 빼요."),
  form("class-photo-upload", "privacy", "reject",
    "얼굴이 다 나온 반 단체 사진을\n그대로 AI 앱에 올렸어요.",
    "올리기 전에 안전한지 한 번 더 생각해요."),

  // 사용 연령 확인 (선생님·보호자가 허락한 AI 사용)
  form("age-check", "age", "approve",
    "AI 앱을 쓰기 전에\n사용 연령을 먼저 확인했어요.",
    "내가 쓸 수 있는 나이인지 먼저 확인해요."),
  form("age-ask-teacher", "age", "approve",
    "사용 연령을 잘 몰라서\n선생님께 여쭤봤어요.",
    "스스로 판단하기 어려우면 어른께 물어봐요."),
  form("teacher-qr", "age", "approve",
    "선생님이 주신 QR 코드로\nAI 앱에 접속했어요.",
    "선생님이 허락한 AI를 사용해요."),
  form("guardian-signup", "age", "approve",
    "AI 앱에 가입할 때\n보호자와 함께 동의했어요.",
    "만 14세 미만은 보호자의 동의가 필요해요."),
  form("age-skip", "age", "reject",
    "재미있어 보여서 사용 연령을\n확인하지 않고 썼어요.",
    "AI를 쓰기 전에 사용 연령을 꼭 확인해요."),
  form("ad-app", "age", "reject",
    "광고에 나온 AI 앱을\n어른께 묻지 않고 설치했어요.",
    "선생님이나 보호자가 허락한 AI를 사용해요."),
  form("age-sign-unknown", "age", "reject",
    "'만 14세 이상'이 무슨 뜻인지\n몰라서 그냥 가입했어요.",
    "모르는 표시가 있으면 어른께 먼저 물어봐요."),
  form("sibling-app", "age", "reject",
    "가족이 쓰는 AI 앱이라\n저도 그냥 사용했어요.",
    "다른 사람이 써도 내 나이에 맞는지 확인해요."),

  // AI 도움 표시 (도움받은 부분 기록, AI가 만든 결과물 표시)
  form("label-video", "label", "approve",
    "AI로 만든 독립운동가 영상에\n'AI가 만든 영상'이라고 적었어요.",
    "AI가 만든 결과물에는 꼭 표시를 해요."),
  form("label-slides", "label", "approve",
    "발표 자료에 AI 도움을 받은\n부분을 표시했어요.",
    "도움받은 부분을 밝히면 바르게 판단할 수 있어요."),
  form("label-voice", "label", "approve",
    "AI 음성으로 만든 영상에\n'AI 음성'이라고 적었어요.",
    "AI 목소리를 썼다는 것도 알려 줘요."),
  form("record-help", "label", "approve",
    "AI로 사진 속 사람을 지운 뒤\n도움받은 부분을 적었어요.",
    "어디에 AI 도움을 받았는지 기록해 둬요."),
  form("forgot-record", "label", "reject",
    "AI 도움을 받은 부분을\n적어 두는 것을 깜빡했어요.",
    "도움받은 부분을 적어 두어야 밝힐 수 있어요."),
  form("didnt-know-label", "label", "reject",
    "AI 도움을 밝혀야 하는 줄 몰라서\n그냥 제 작품이라고 했어요.",
    "AI가 도와준 부분은 꼭 밝혀요."),
  form("board-unlabeled", "label", "reject",
    "AI로 만든 그림을 표시 없이\n학급 게시판에 올렸어요.",
    "표시가 없으면 진짜 그림인지 헷갈릴 수 있어요."),
  form("edited-photo-unlabeled", "label", "reject",
    "AI로 사람을 지운 사진인 걸\n말하지 않고 보여 줬어요.",
    "AI로 고친 사진도 고쳤다고 밝혀요."),

  // 고운 말 (AI와 대화할 때도 예의 지키기)
  form("thank-ai", "kind", "approve",
    "AI가 도와줘서\n'고마워'라고 말했어요.",
    "AI와 대화할 때도 고운 말을 써요."),
  form("calm-retry", "kind", "approve",
    "AI가 말을 못 알아들어도\n천천히 다시 말했어요.",
    "답답해도 차분하고 고운 말로 말해요."),
  form("polite-request", "kind", "approve",
    "AI에게 그림을 부탁할 때\n'그려 주세요'라고 썼어요.",
    "AI를 대하는 말투가 내 언어 습관이 돼요."),
  form("kind-retry-request", "kind", "approve",
    "AI로 생성한 그림이 마음에 안 들어\n'다시 그려 줄래?'라고 부탁했어요.",
    "마음에 안 들어도 고운 말로 부탁해요."),
  form("speaker-yell", "kind", "reject",
    "AI 스피커가 못 알아들어서\n'바보야!'라고 소리쳤어요.",
    "AI에게 하는 말도 내 언어 습관이 돼요."),
  form("rough-order", "kind", "reject",
    "AI는 기계라서 괜찮은 줄 알고\n거친 말로 명령했어요.",
    "AI와 대화할 때도 예의를 지켜요."),
  form("bad-word-joke", "kind", "reject",
    "장난으로 AI에게\n나쁜 말을 따라 하게 했어요.",
    "나쁜 말은 장난이어도 쓰지 않아요."),
  form("annoyed-typing", "kind", "reject",
    "AI 답이 마음에 안 들어서\n'짜증 나!'라고 입력했어요.",
    "마음에 안 들면 고운 말로 다시 부탁해요."),

  // 로그아웃 (함께 쓰는 기기에서 내 계정 지키기)
  form("logout-done", "logout", "approve",
    "캔바로 영상을 다 만든 뒤\n로그아웃했어요.",
    "AI를 사용한 뒤에는 꼭 로그아웃해요."),
  form("tablet-return", "logout", "approve",
    "학교 태블릿을 반납하기 전에\nAI 앱에서 로그아웃했어요.",
    "다음 사람이 내 계정을 쓰지 않게 해요."),
  form("library-pc", "logout", "approve",
    "도서관 컴퓨터에서 AI를 쓴 뒤\n로그아웃을 확인했어요.",
    "함께 쓰는 컴퓨터는 더 꼼꼼히 확인해요."),
  form("remind-friend", "logout", "approve",
    "친구 계정이 열려 있는 걸 보고\n친구에게 알려 줬어요.",
    "로그아웃을 서로 챙겨 주면 좋아요."),
  form("bell-rang", "logout", "reject",
    "쉬는 시간 종이 울려서\n로그아웃 없이 나갔어요.",
    "급해도 로그아웃하고 자리를 떠나요."),
  form("screen-off", "logout", "reject",
    "로그아웃 대신\n화면만 끄고 반납했어요.",
    "화면을 꺼도 계정은 열려 있을 수 있어요."),
  form("friend-uses-account", "logout", "reject",
    "제 계정이 열린 태블릿을\n친구가 쓰게 그냥 두었어요.",
    "다른 사람의 정보가 섞여 잘못 알려 줄 수 있어요."),
  form("stay-logged-in", "logout", "reject",
    "다음에 편하려고 학교 태블릿에\n로그인한 채로 두었어요.",
    "함께 쓰는 기기에는 로그인을 남기지 않아요."),
];

export const ETHICS_RULES = [
  ["age", "사용 연령을 확인해요"],
  ["label", "AI 도움을 표시해요"],
  ["privacy", "개인 정보를 지켜요"],
  ["kind", "고운 말을 써요"],
  ["logout", "다 쓰면 로그아웃해요"],
] as const satisfies readonly (readonly [EthicsCategory, string])[];

export const ETHICS_CATEGORY_LABELS: Record<EthicsCategory, string> = {
  age: "사용 연령", label: "AI 도움 표시", privacy: "개인 정보",
  kind: "고운 말", logout: "로그아웃",
};

/** Students who bring their forms to Midi's window, shuffled each shift. */
export const ETHICS_VISITORS: readonly EthicsVisitor[] = [
  { id: "ethics-student-01", name: "준호" }, // 3학년
  { id: "ethics-student-02", name: "지아" }, // 4학년
  { id: "ethics-student-03", name: "현우" }, // 6학년
  { id: "ethics-student-04", name: "서연" }, // 5학년
  { id: "ethics-student-05", name: "시우" }, // 4학년
  { id: "ethics-student-06", name: "하윤" }, // 3학년
  { id: "ethics-student-07", name: "도윤" }, // 5학년
  { id: "ethics-student-08", name: "수아" }, // 6학년
  { id: "ethics-student-09", name: "이준" }, // 3학년
  { id: "ethics-student-10", name: "예린" }, // 4학년
  { id: "ethics-student-11", name: "민준" }, // 6학년
  { id: "ethics-student-12", name: "채원" }, // 5학년
  { id: "ethics-student-13", name: "다은" }, // 3학년
  { id: "ethics-student-14", name: "건우" }, // 5학년
  { id: "ethics-student-15", name: "태윤" }, // 6학년
  { id: "ethics-student-16", name: "은호" }, // 4학년
  { id: "ethics-student-17", name: "하린" }, // 5학년
  { id: "ethics-student-18", name: "지후" }, // 3학년
  { id: "ethics-student-19", name: "서아" }, // 4학년
  { id: "ethics-student-20", name: "우진" }, // 6학년
  { id: "ethics-student-21", name: "유나" }, // 3학년
  { id: "ethics-student-22", name: "로운" }, // 5학년
  { id: "ethics-student-23", name: "민서" }, // 6학년
  { id: "ethics-student-24", name: "주원" }, // 4학년
];

/**
 * What the student says after the stamp, by what they did and what Midi
 * stamped. A rightly rejected form was the student's own mistake, so they
 * own it instead of thanking Midi. Picked by case index.
 */
export const ETHICS_VISITOR_LINES = {
  /** Good use, approved. */
  approveRight: ["고마워요!", "역시 미디!", "최고예요!", "기억할게요!"],
  /** A mistake, rightly rejected. */
  rejectRight: ["앞으로 조심할게요.", "아, 그렇군요…"],
  /** A mistake, but approved anyway: the student stays quiet and Midi explains. */
  approveWrong: [],
  /** Good use, but rejected: the student stays quiet and Midi explains. */
  rejectWrong: [],
} as const;
