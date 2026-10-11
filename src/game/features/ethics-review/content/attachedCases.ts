import type {
  EthicsAttachment, EthicsAttachmentKind, EthicsCategory, EthicsReviewCase,
} from "../model/types";

/**
 * DRAFT — forms with attachments for stages 2 and 3.
 *
 * The form always makes a good-sounding claim; the attachments show what really
 * happened. The verdict is derived: approve only when every attachment backs
 * the claim, so a single contradicting paper means reject. Each paper checks one
 * of the textbook's five AI 사용 약속.
 */

/** Which ethics topic each attachment kind checks. */
export const ETHICS_ATTACHMENT_CATEGORY: Record<EthicsAttachmentKind, EthicsCategory> = {
  signup: "age",
  artwork: "label",
  consent: "privacy",
  chat: "kind",
  tablet: "logout",
};

/** Short names printed on each attachment's header. */
export const ETHICS_ATTACHMENT_LABELS: Record<EthicsAttachmentKind, string> = {
  signup: "가입 화면",
  artwork: "만든 작품",
  consent: "허락 쪽지",
  chat: "AI 대화 화면",
  tablet: "반납한 태블릿",
};

const paper = (kind: EthicsAttachmentKind, ok: boolean, text: string): EthicsAttachment => ({ kind, ok, text });

const attached = (
  id: string, prompt: string, attachments: readonly EthicsAttachment[], explanation: string,
): EthicsReviewCase => {
  const failing = attachments.find(item => !item.ok);
  return {
    id, prompt, explanation, attachments,
    verdict: failing ? "reject" : "approve",
    category: ETHICS_ATTACHMENT_CATEGORY[(failing ?? attachments[0]).kind],
  };
};

const SIGNUP_OK = paper("signup", true, "사용 연령 8세 이상\n보호자 동의 ✓");
const SIGNUP_NO_GUARDIAN = paper("signup", false, "사용 연령 8세 이상\n보호자 동의 (빈칸)");
const SIGNUP_TOO_YOUNG = paper("signup", false, "사용 연령\n만 14세 이상");
const ART_LABELED = paper("artwork", true, "무대 배경 그림\n※ AI가 만든 그림");
const ART_UNLABELED = paper("artwork", false, "무대 배경 그림\n(표시 없음)");
const CONSENT_OK = paper("consent", true, "내 사진 써도 좋아!\n- 하린 (서명)");
const CONSENT_NONE = paper("consent", false, "허락받은 사람:\n(아직 없음)");
const CHAT_KIND = paper("chat", true, "배경 그림 그려 줄래?\n고마워!");
const CHAT_RUDE = paper("chat", false, "이것도 못 그려?\n바보야!");
const TABLET_OUT = paper("tablet", true, "AI 앱 화면\n로그아웃됨 ✓");
const TABLET_IN = paper("tablet", false, "AI 앱 화면\n내 계정 로그인 중");

/** Stage 2: the form plus one attachment. */
export const ETHICS_STAGE2_CASES: readonly EthicsReviewCase[] = [
  attached("s2-signup-ok", "사용 연령을 확인하고\nAI 앱에 가입했어요.",
    [SIGNUP_OK], "내 나이에 맞고 보호자 동의도 받았어요."),
  attached("s2-signup-no-guardian", "사용 연령을 확인하고\nAI 앱에 가입했어요.",
    [SIGNUP_NO_GUARDIAN], "만 14세 미만은 보호자 동의가 필요해요."),
  attached("s2-artwork-labeled", "AI로 만든 무대 배경에\nAI 표시를 했어요.",
    [ART_LABELED], "AI가 만든 그림이라고 잘 표시했어요."),
  attached("s2-artwork-unlabeled", "AI로 만든 무대 배경에\nAI 표시를 했어요.",
    [ART_UNLABELED], "그림 어디에도 AI 표시가 없어요."),
  attached("s2-consent-signed", "AI 초대장에 친구 사진을 넣기 전에\n허락을 받았어요.",
    [CONSENT_OK], "허락 쪽지에 친구 서명이 있어요."),
  attached("s2-consent-missing", "AI 초대장에 친구 사진을 넣기 전에\n허락을 받았어요.",
    [CONSENT_NONE], "허락을 받았다는 기록이 없어요."),
  attached("s2-chat-kind", "AI와 대화할 때\n고운 말을 썼어요.",
    [CHAT_KIND], "부탁하고 고마운 마음도 표현했어요."),
  attached("s2-chat-rude", "AI와 대화할 때\n고운 말을 썼어요.",
    [CHAT_RUDE], "답답해도 고운 말로 다시 부탁해요."),
  attached("s2-tablet-out", "AI를 다 쓰고\n로그아웃했어요.",
    [TABLET_OUT], "다음 사람이 내 계정을 쓸 수 없어요."),
  attached("s2-tablet-in", "AI를 다 쓰고\n로그아웃했어요.",
    [TABLET_IN], "아직 로그인된 채로 반납했어요."),
];

/** Stage 3: the form plus two attachments; one wrong paper is enough to reject. */
export const ETHICS_STAGE3_CASES: readonly EthicsReviewCase[] = [
  attached("s3-stage-ok", "AI로 무대 배경을 만들어 표시하고\n로그아웃까지 했어요.",
    [ART_LABELED, TABLET_OUT], "표시도 하고 로그아웃도 잘했어요."),
  attached("s3-stage-unlabeled", "AI로 무대 배경을 만들어 표시하고\n로그아웃까지 했어요.",
    [ART_UNLABELED, TABLET_OUT], "로그아웃은 했지만 AI 표시가 빠졌어요."),
  attached("s3-stage-logged-in", "AI로 무대 배경을 만들어 표시하고\n로그아웃까지 했어요.",
    [ART_LABELED, TABLET_IN], "표시는 했지만 아직 로그인 중이에요."),
  attached("s3-invite-ok", "친구 허락을 받고 AI 초대장을\n고운 말로 부탁했어요.",
    [CONSENT_OK, CHAT_KIND], "허락도 받고 고운 말도 썼어요."),
  attached("s3-invite-no-consent", "친구 허락을 받고 AI 초대장을\n고운 말로 부탁했어요.",
    [CONSENT_NONE, CHAT_KIND], "말은 고왔지만 허락받은 기록이 없어요."),
  attached("s3-invite-rude", "친구 허락을 받고 AI 초대장을\n고운 말로 부탁했어요.",
    [CONSENT_OK, CHAT_RUDE], "허락은 받았지만 AI에게 거친 말을 했어요."),
  attached("s3-poster-ok", "새 AI 앱으로 무대 배경을 만들고\nAI 표시를 했어요.",
    [SIGNUP_OK, ART_LABELED], "나이에 맞는 앱을 쓰고 표시도 했어요."),
  attached("s3-poster-too-young", "새 AI 앱으로 무대 배경을 만들고\nAI 표시를 했어요.",
    [SIGNUP_TOO_YOUNG, ART_LABELED], "만 14세 이상만 쓸 수 있는 앱이에요."),
  attached("s3-poster-unlabeled", "새 AI 앱으로 무대 배경을 만들고\nAI 표시를 했어요.",
    [SIGNUP_OK, ART_UNLABELED], "앱은 괜찮지만 AI 표시가 빠졌어요."),
  attached("s3-signup-chat-ok", "보호자와 AI 앱에 가입하고\n고운 말로 대화했어요.",
    [SIGNUP_OK, CHAT_KIND], "보호자 동의도 받고 고운 말도 썼어요."),
];
