export function getServiceChoiceCount(roundIndex: number) {
  return Math.min(5, 3 + Math.floor(roundIndex / 2));
}

export function getServicePadIndices(choiceCount: number) {
  if (choiceCount === 3) return [1, 2, 3];
  if (choiceCount === 4) return [0, 1, 3, 4];
  return [0, 1, 2, 3, 4];
}

export function isCorrectServiceChoice(toolId: string, answerId: string) {
  return toolId === answerId;
}

export function getServiceMistakeProgress(mistakeCount: number) {
  return { mistakeCount: mistakeCount + 1, combo: 0 };
}

export function getServiceSuccessProgress(
  correctCount: number,
  combo: number,
  missedCurrentRound: boolean,
) {
  return {
    correctCount: correctCount + 1,
    combo: missedCurrentRound ? 0 : combo + 1,
  };
}

export function getServiceStarCount(mistakeCount: number) {
  return mistakeCount <= 1 ? 3 : mistakeCount <= 3 ? 2 : 1;
}
