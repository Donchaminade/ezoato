import 'package:flutter_test/flutter_test.dart';
import 'package:ezoa_to/features/ai/presentation/revision_screen.dart';
import 'package:ezoa_to/shared/models/models.dart';

void main() {
  test('AiGuideTurn.fromJson conserve la phase et refuse le corrigé', () {
    final turn = AiGuideTurn.fromJson({
      'sessionId': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'phase': 'confirm',
      'reply': 'Est-ce bien celle-là ?',
      'disclaimer': "Ceci n'est pas la correction officielle du jury.",
      'officialGrade': false,
      'solvesExercise': false,
      'leakBlocked': false,
      'candidates': [
        {
          'id': 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb',
          'titre': 'BEPC Mathématiques 2021',
          'examen': 'BEPC',
          'annee': 2021,
          'etablissement': 'Lycée de Tokoin',
        },
      ],
    });
    expect(turn.phase, 'confirm');
    expect(turn.solvesExercise, isFalse);
    expect(turn.officialGrade, isFalse);
    expect(turn.candidates.single.line, contains('Tokoin'));
    expect(turn.reply, contains('celle-là'));
  });

  test('inferAiMode route les matières', () {
    expect(inferAiMode('Mathématiques'), kAiModeCalcul);
    expect(inferAiMode('Philosophie'), kAiModeRedaction);
    expect(inferAiMode('SVT'), kAiModeCalcul);
    expect(inferAiMode('Autre'), kAiModeQuiz);
  });

  test('AiJudge.fromJson conserve disclaimer et OCR', () {
    final judge = AiJudge.fromJson({
      'verdict': 'partial',
      'feedback': 'Reprends la méthode',
      'disclaimer': "Ceci n'est pas la correction officielle du jury.",
      'officialGrade': false,
      'juryCorrection': false,
      'extractedText': 'x = 3',
      'visionUsed': true,
      'imageReceived': true,
      'solvesExercise': false,
    });
    expect(judge.officialGrade, isFalse);
    expect(judge.juryCorrection, isFalse);
    expect(judge.extractedText, 'x = 3');
    expect(judge.visionUsed, isTrue);
    expect(judge.disclaimer, contains('jury'));
  });

  test('AiQuizStart.fromJson sans bonnes réponses', () {
    final quiz = AiQuizStart.fromJson({
      'sessionId': 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
      'disclaimer': 'entraînement',
      'grounded': true,
      'officialGrade': false,
      'questions': [
        {
          'id': 'q1',
          'prompt': 'Question',
          'choices': [
            {'id': 'A', 'text': 'Oui'},
            {'id': 'B', 'text': 'Non'},
          ],
        },
      ],
      'progress': {'index': 0, 'total': 1, 'answered': 0, 'correct': 0},
    });
    expect(quiz.grounded, isTrue);
    expect(quiz.officialGrade, isFalse);
    expect(quiz.currentQuestion?.choices.first.id, 'A');
  });
}
