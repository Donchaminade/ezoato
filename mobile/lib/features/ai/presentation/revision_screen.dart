import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../../shared/widgets/subscription_pro_widgets.dart';
import '../../account/data/subscription_providers.dart';
import '../../epreuves/presentation/epreuve_detail_screen.dart';

AiMode inferAiMode(String? matiere) {
  final m = (matiere ?? '').toLowerCase();
  if (RegExp(r'math|physique|chimie|svt|biologie|science').hasMatch(m)) {
    return kAiModeCalcul;
  }
  if (RegExp(r'fran|philo|histoire|géo|geo|lettre|anglais|dissert').hasMatch(m)) {
    return kAiModeRedaction;
  }
  return kAiModeQuiz;
}

class RevisionScreen extends ConsumerStatefulWidget {
  const RevisionScreen({
    super.key,
    this.epreuveId,
    this.epreuveTitle,
    this.matiere,
  });

  final String? epreuveId;
  final String? epreuveTitle;
  final String? matiere;

  @override
  ConsumerState<RevisionScreen> createState() => _RevisionScreenState();
}

class _RevisionScreenState extends ConsumerState<RevisionScreen> {
  late AiMode _mode;

  @override
  void initState() {
    super.initState();
    _mode = inferAiMode(widget.matiere);
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final subAsync = ref.watch(subscriptionStatusProvider);
    final premium = subAsync.maybeWhen(data: (s) => s.actif, orElse: () => false);
    final epreuveAsync = widget.epreuveId == null
        ? null
        : ref.watch(epreuveDetailProvider(widget.epreuveId!));
    final accessAsync = widget.epreuveId == null
        ? null
        : ref.watch(paymentAccessProvider(widget.epreuveId!));

    final epreuve = epreuveAsync?.value;
    final title = widget.epreuveTitle ?? epreuve?.titre;
    final matiere = widget.matiere ?? epreuve?.matiere;
    final access = accessAsync?.value;
    final lockedPaper = access != null &&
        access.requiresPayment &&
        !access.hasAccess;

    return EzoaDetailScreen(
      title: 'Réviser avec l\'IA',
      body: ListView(
        padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
        children: [
          EzoaGlassCard(
            margin: EdgeInsets.zero,
            enableShine: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Icon(LucideIcons.sparkles, color: pal.accent, size: 20),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        title == null
                            ? 'Tuteur ancré sur les épreuves'
                            : 'Tuteur de « $title »',
                        style: EzoaTypography.titleSmall(context),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                Text(
                  title == null
                      ? 'Rédaction, sciences ou QCM à partir d\'une épreuve. '
                          'Ce n\'est pas la correction du jury.'
                      : 'L\'IA s\'appuie sur cette épreuve ($matiere). '
                          'Ce n\'est pas la correction officielle du jury.',
                  style: EzoaTypography.bodySmall(context),
                ),
              ],
            ),
          ),
          const SizedBox(height: 12),
          _DisclaimerBanner(),
          const SizedBox(height: 16),
          Wrap(
            spacing: 8,
            runSpacing: 8,
            children: [
              _ModeChip(
                label: 'Rédaction',
                icon: LucideIcons.pencil,
                selected: _mode == kAiModeRedaction,
                onTap: () => setState(() => _mode = kAiModeRedaction),
              ),
              _ModeChip(
                label: 'Maths / sciences',
                icon: LucideIcons.flaskConical,
                selected: _mode == kAiModeCalcul,
                onTap: () => setState(() => _mode = kAiModeCalcul),
              ),
              _ModeChip(
                label: 'QCM',
                icon: LucideIcons.brain,
                selected: _mode == kAiModeQuiz,
                onTap: () => setState(() => _mode = kAiModeQuiz),
              ),
            ],
          ),
          const SizedBox(height: 16),
          subAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: EzoaGlassLoader()),
            ),
            error: (e, _) => _LockCard(
              title: 'Statut Pro indisponible',
              body: '$e',
              cta: 'Réessayer',
              onTap: () => ref.invalidate(subscriptionStatusProvider),
            ),
            data: (status) {
              if (!premium) {
                return Column(
                  crossAxisAlignment: CrossAxisAlignment.stretch,
                  children: [
                    SubscriptionProUpgradeBanner(status: status),
                    _LockCard(
                      title: 'Fonctionnalité Pro',
                      body:
                          'Les modes rédaction, sciences et QCM IA sont inclus dans '
                          'l\'abonnement Pro (Flooz ou T-Money).',
                      cta: 'Voir l\'abonnement Pro',
                      icon: LucideIcons.crown,
                      onTap: () => context.push('/account/abonnement'),
                    ),
                  ],
                );
              }
              if (lockedPaper) {
                return _LockCard(
                  title: 'Épreuve payante',
                  body:
                      'Débloque cette épreuve (paiement unitaire ou Pro) pour l\'utiliser comme support.',
                  cta: 'Voir l\'accès',
                  onTap: () => context.push('/account/abonnement'),
                );
              }
              if (_mode == kAiModeRedaction) {
                return _EssayPanel(
                  epreuveId: widget.epreuveId,
                  matiere: matiere,
                );
              }
              if (_mode == kAiModeCalcul) {
                return _CalculPanel(
                  epreuveId: widget.epreuveId,
                  matiere: matiere,
                );
              }
              return _QuizPanel(epreuveId: widget.epreuveId);
            },
          ),
        ],
      ),
    );
  }
}

class _DisclaimerBanner extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        color: pal.gold.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(14),
        border: Border.all(color: pal.gold.withValues(alpha: 0.35)),
      ),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(LucideIcons.alertTriangle, size: 18, color: pal.gold),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              'Garde-fou : ceci n\'est pas la correction officielle du jury. '
              'Vérifie toujours avec ton enseignant. En sciences, tu travailles au brouillon.',
              style: EzoaTypography.bodySmall(context),
            ),
          ),
        ],
      ),
    );
  }
}

class _ModeChip extends StatelessWidget {
  const _ModeChip({
    required this.label,
    required this.icon,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return ChoiceChip(
      label: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 16, color: selected ? Colors.white : pal.text),
          const SizedBox(width: 6),
          Text(label),
        ],
      ),
      selected: selected,
      onSelected: (_) => onTap(),
      selectedColor: EzoaColors.primary,
      labelStyle: TextStyle(
        color: selected ? Colors.white : pal.text,
        fontWeight: FontWeight.w600,
      ),
    );
  }
}

class _LockCard extends StatelessWidget {
  const _LockCard({
    required this.title,
    required this.body,
    required this.cta,
    required this.onTap,
    this.icon = LucideIcons.lock,
  });

  final String title;
  final String body;
  final String cta;
  final VoidCallback onTap;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      enableShine: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Row(
            children: [
              Icon(icon, size: 18, color: EzoaColors.of(context).gold),
              const SizedBox(width: 8),
              Expanded(
                child: Text(title, style: EzoaTypography.titleSmall(context)),
              ),
            ],
          ),
          const SizedBox(height: 8),
          Text(body, style: EzoaTypography.bodySmall(context)),
          const SizedBox(height: 12),
          EzoaButton(label: cta, onPressed: onTap, icon: icon),
        ],
      ),
    );
  }
}

class _EssayPanel extends ConsumerStatefulWidget {
  const _EssayPanel({this.epreuveId, this.matiere});

  final String? epreuveId;
  final String? matiere;

  @override
  ConsumerState<_EssayPanel> createState() => _EssayPanelState();
}

class _EssayPanelState extends ConsumerState<_EssayPanel> {
  final _question = TextEditingController();
  final _essay = TextEditingController();
  final _rewrite = TextEditingController();
  bool _busy = false;
  AiEssayFeedback? _feedback;

  @override
  void dispose() {
    _question.dispose();
    _essay.dispose();
    _rewrite.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    if (_essay.text.trim().length < 40) {
      _toast('Écris d\'abord ta copie (40 caractères min.)');
      return;
    }
    setState(() => _busy = true);
    try {
      final res = await ref.read(apiClientProvider).submitAiEssay(
            epreuveId: widget.epreuveId,
            question: _question.text.trim().isEmpty
                ? 'Sujet ${widget.matiere ?? 'de rédaction'}'
                : _question.text.trim(),
            essay: _essay.text.trim(),
            rewriteParagraph:
                _rewrite.text.trim().isEmpty ? null : _rewrite.text.trim(),
          );
      if (mounted) {
        setState(() => _feedback = res);
        _toast('Feedback d\'entraînement — à confirmer en classe');
      }
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'Lis l\'épreuve, rédige ici, puis envoie. L\'IA commente le plan, '
          'les arguments et le style — elle ne note pas.',
          style: EzoaTypography.bodySmall(context),
        ),
        const SizedBox(height: 12),
        _MultilineField(controller: _question, label: 'Sujet / consigne', maxLength: 2000),
        _MultilineField(controller: _essay, label: 'Ta copie', maxLength: 8000, minLines: 6),
        _MultilineField(
          controller: _rewrite,
          label: 'Paragraphe à améliorer (optionnel)',
          maxLength: 1200,
        ),
        EzoaButton(
          label: 'Envoyer pour un feedback',
          onPressed: _busy ? null : _submit,
          loading: _busy,
          icon: LucideIcons.pencil,
        ),
        if (_feedback != null) ...[
          const SizedBox(height: 16),
          _FeedbackCard(
            children: [
              _BulletBlock(title: 'Plan', items: _feedback!.outline),
              _BulletBlock(title: 'Arguments', items: _feedback!.arguments),
              if (_feedback!.style.isNotEmpty)
                Text('Style — ${_feedback!.style}', style: EzoaTypography.bodySmall(context)),
              _BulletBlock(title: 'Manques', items: _feedback!.gaps),
              if (_feedback!.rewriteGuided != null) ...[
                Text('Réécriture guidée', style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 4),
                Text(_feedback!.rewriteGuided!, style: EzoaTypography.bodySmall(context)),
                _BulletBlock(title: '', items: _feedback!.rewriteTips),
              ],
              Text(_feedback!.disclaimer, style: EzoaTypography.bodySmall(context)),
            ],
          ),
        ],
      ],
    );
  }
}

class _CalculPanel extends ConsumerStatefulWidget {
  const _CalculPanel({this.epreuveId, this.matiere});

  final String? epreuveId;
  final String? matiere;

  @override
  ConsumerState<_CalculPanel> createState() => _CalculPanelState();
}

class _CalculPanelState extends ConsumerState<_CalculPanel> {
  final _question = TextEditingController();
  final _answer = TextEditingController();
  String? _sessionId;
  String? _imagePath;
  AiCoach? _coach;
  AiJudge? _judge;
  String? _busy;

  @override
  void dispose() {
    _question.dispose();
    _answer.dispose();
    super.dispose();
  }

  Future<void> _startCoach() async {
    if (_question.text.trim().length < 8) {
      _toast('Colle d\'abord l\'énoncé (tu calcules ensuite sur papier).');
      return;
    }
    setState(() {
      _busy = 'coach';
      _judge = null;
    });
    try {
      final started = await ref.read(apiClientProvider).startAiSession(
            mode: kAiModeCalcul,
            epreuveId: widget.epreuveId,
            question: _question.text.trim(),
            matiere: widget.matiere,
          );
      final coach = started.coach ??
          await ref.read(apiClientProvider).getAiCoach(
                question: _question.text.trim(),
                sessionId: started.sessionId,
                epreuveId: widget.epreuveId,
              );
      if (mounted) {
        setState(() {
          _sessionId = started.sessionId;
          _coach = coach;
        });
      }
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final file = await picker.pickImage(
      source: ImageSource.gallery,
      maxWidth: 2000,
      imageQuality: 85,
    );
    if (file == null) return;
    final bytes = await file.length();
    if (bytes > 2 * 1024 * 1024) {
      if (mounted) _toast('Image trop lourde (2 Mo max)');
      return;
    }
    if (mounted) setState(() => _imagePath = file.path);
  }

  Future<void> _submitAnswer() async {
    if (_answer.text.trim().isEmpty && _imagePath == null) {
      _toast('Saisis ta réponse finale ou ajoute une photo de copie.');
      return;
    }
    setState(() => _busy = 'judge');
    try {
      final res = await ref.read(apiClientProvider).judgeAiAnswer(
            sessionId: _sessionId,
            question: _question.text.trim(),
            studentAnswer:
                _answer.text.trim().isEmpty ? null : _answer.text.trim(),
            imagePath: _imagePath,
            epreuveId: widget.epreuveId,
          );
      if (mounted) {
        setState(() {
          _judge = res;
          if (res.coach != null) _coach = res.coach;
        });
      }
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = null);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          'L\'IA n\'est pas un solveur : elle rappelle la méthode et un exemple voisin. '
          'Tu travailles sur papier, puis tu soumets ta réponse finale.',
          style: EzoaTypography.bodySmall(context),
        ),
        const SizedBox(height: 12),
        _MultilineField(controller: _question, label: 'Énoncé', maxLength: 12000, minLines: 4),
        EzoaButton(
          label: 'Voir la méthode (sans la solution)',
          onPressed: _busy != null ? null : _startCoach,
          loading: _busy == 'coach',
          icon: LucideIcons.lightbulb,
        ),
        if (_coach != null) ...[
          const SizedBox(height: 12),
          _FeedbackCard(
            children: [
              Text('Méthode', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 4),
              Text(_coach!.method, style: EzoaTypography.bodySmall(context)),
              _BulletBlock(title: 'Formules', items: _coach!.formulas),
              Text('Exemple similaire (pas ton exercice)', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 4),
              Text(_coach!.examplePrompt, style: EzoaTypography.bodySmall(context)),
              _BulletBlock(title: '', items: _coach!.exampleSteps, numbered: true),
              Text(_coach!.disclaimer, style: EzoaTypography.bodySmall(context)),
            ],
          ),
        ],
        const SizedBox(height: 12),
        _MultilineField(controller: _answer, label: 'Ta réponse finale', maxLength: 800),
        Text(
          _imagePath == null
              ? 'Photo de copie (JPG, PNG, WebP — 2 Mo max)'
              : 'Photo sélectionnée',
          style: EzoaTypography.bodySmall(context),
        ),
        const SizedBox(height: 8),
        EzoaButton(
          label: _imagePath == null ? 'Ajouter une photo' : 'Changer la photo',
          variant: EzoaButtonVariant.outline,
          onPressed: _pickImage,
          icon: LucideIcons.camera,
        ),
        const SizedBox(height: 8),
        EzoaButton(
          label: 'Soumettre pour un avis',
          variant: EzoaButtonVariant.outline,
          onPressed: (_busy != null || _coach == null) ? null : _submitAnswer,
          loading: _busy == 'judge',
          icon: LucideIcons.checkCircle,
        ),
        if (_judge != null) ...[
          const SizedBox(height: 12),
          _FeedbackCard(
            children: [
              Text(
                'Avis : ${_verdictLabel(_judge!.verdict)}',
                style: EzoaTypography.titleSmall(context),
              ),
              const SizedBox(height: 4),
              Text(_judge!.feedback, style: EzoaTypography.bodySmall(context)),
              if (_judge!.extractedText != null && _judge!.extractedText!.isNotEmpty) ...[
                const SizedBox(height: 8),
                Text(
                  'Texte lu sur la photo : ${_judge!.extractedText}',
                  style: EzoaTypography.bodySmall(context),
                ),
              ],
              if (_judge!.hint != null) ...[
                const SizedBox(height: 8),
                Text(_judge!.hint!, style: EzoaTypography.bodySmall(context)),
              ],
              const SizedBox(height: 8),
              Text(_judge!.disclaimer, style: EzoaTypography.bodySmall(context)),
            ],
          ),
        ],
      ],
    );
  }
}

class _QuizPanel extends ConsumerStatefulWidget {
  const _QuizPanel({this.epreuveId});

  final String? epreuveId;

  @override
  ConsumerState<_QuizPanel> createState() => _QuizPanelState();
}

class _QuizPanelState extends ConsumerState<_QuizPanel> {
  final _source = TextEditingController();
  String? _sessionId;
  AiQuizQuestion? _question;
  AiProgress? _progress;
  String? _choice;
  bool _correct = false;
  bool _hasLast = false;
  AiExplanation? _explanation;
  AiQuizQuestion? _next;
  bool _done = false;
  String _disclaimer = '';
  bool _busy = false;
  bool _grounded = false;

  @override
  void dispose() {
    _source.dispose();
    super.dispose();
  }

  Future<void> _start() async {
    if (widget.epreuveId == null && _source.text.trim().length < 20) {
      _toast('Colle un extrait d\'épreuve (20 caractères min.)');
      return;
    }
    setState(() {
      _busy = true;
      _hasLast = false;
      _done = false;
      _choice = null;
    });
    try {
      final res = await ref.read(apiClientProvider).generateAiQuiz(
            epreuveId: widget.epreuveId,
            sourceText: _source.text.trim().isEmpty ? null : _source.text.trim(),
          );
      if (mounted) {
        setState(() {
          _sessionId = res.sessionId;
          _question = res.currentQuestion;
          _progress = res.progress;
          _disclaimer = res.disclaimer;
          _grounded = res.grounded;
        });
      }
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  Future<void> _answer() async {
    final sessionId = _sessionId;
    final question = _question;
    final choice = _choice;
    if (sessionId == null || question == null || choice == null) return;
    setState(() => _busy = true);
    try {
      final res = await ref.read(apiClientProvider).answerAiQuiz(
            sessionId: sessionId,
            questionId: question.id,
            choiceId: choice,
          );
      if (mounted) {
        setState(() {
          _hasLast = true;
          _correct = res.correct;
          _explanation = res.explanation;
          _progress = res.progress;
          _next = res.nextQuestion;
          _done = res.done;
          _disclaimer = res.disclaimer;
        });
      }
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        if (widget.epreuveId == null)
          _MultilineField(
            controller: _source,
            label: 'Extrait (optionnel si une épreuve est liée)',
            maxLength: 12000,
            minLines: 4,
          ),
        EzoaButton(
          label: 'Lancer le QCM',
          onPressed: _busy ? null : _start,
          loading: _busy && _question == null,
          icon: LucideIcons.brain,
        ),
        if (_grounded) ...[
          const SizedBox(height: 8),
          Text(
            'QCM ancré sur l\'épreuve ouverte.',
            style: EzoaTypography.bodySmall(context),
          ),
        ],
        if (_progress != null) ...[
          const SizedBox(height: 8),
          Text(
            'Question ${(_progress!.index + 1).clamp(1, _progress!.total)} / ${_progress!.total} · '
            '${_progress!.correct} juste(s) — score d\'entraînement seulement',
            style: EzoaTypography.bodySmall(context),
          ),
        ],
        if (_question != null && (!_done || _hasLast)) ...[
          const SizedBox(height: 12),
          EzoaGlassCard(
            margin: EdgeInsets.zero,
            enableShine: false,
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Text(_question!.prompt, style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 12),
                ..._question!.choices.map((c) {
                  final selected = _choice == c.id;
                  return Padding(
                    padding: const EdgeInsets.only(bottom: 8),
                    child: OutlinedButton(
                      onPressed: _busy || _hasLast ? null : () => setState(() => _choice = c.id),
                      style: OutlinedButton.styleFrom(
                        alignment: Alignment.centerLeft,
                        backgroundColor: selected
                            ? EzoaColors.primary.withValues(alpha: 0.12)
                            : null,
                        side: BorderSide(
                          color: selected ? EzoaColors.primary : pal.border,
                        ),
                      ),
                      child: Text('${c.id}. ${c.text}'),
                    ),
                  );
                }),
                if (!_hasLast)
                  EzoaButton(
                    label: 'Valider',
                    onPressed: (_choice == null || _busy) ? null : _answer,
                    loading: _busy,
                  )
                else ...[
                  Text(
                    _correct ? 'Correct (entraînement).' : 'Pas encore — lis l\'explication puis continue.',
                    style: EzoaTypography.bodySmall(context).copyWith(
                      color: _correct ? pal.emerald : pal.error,
                    ),
                  ),
                  if (_explanation != null)
                    _BulletBlock(title: '', items: _explanation!.steps, numbered: true),
                  const SizedBox(height: 8),
                  EzoaButton(
                    label: _done ? 'Terminé' : 'Question suivante',
                    onPressed: (_next == null && !_done)
                        ? null
                        : () {
                            setState(() {
                              if (_next != null) _question = _next;
                              _next = null;
                              _hasLast = false;
                              _choice = null;
                            });
                          },
                  ),
                ],
              ],
            ),
          ),
        ],
        if (_done) ...[
          const SizedBox(height: 12),
          Text(
            'Série terminée. ${_progress?.correct}/${_progress?.total} — confirme avec ton enseignant.',
            style: EzoaTypography.bodySmall(context),
          ),
        ],
        if (_disclaimer.isNotEmpty) ...[
          const SizedBox(height: 8),
          Text(_disclaimer, style: EzoaTypography.bodySmall(context)),
        ],
      ],
    );
  }
}

class _MultilineField extends StatelessWidget {
  const _MultilineField({
    required this.controller,
    required this.label,
    this.maxLength = 2000,
    this.minLines = 3,
  });

  final TextEditingController controller;
  final String label;
  final int maxLength;
  final int minLines;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: TextField(
        controller: controller,
        maxLength: maxLength,
        minLines: minLines,
        maxLines: minLines + 6,
        style: EzoaTypography.bodySmall(context).copyWith(color: pal.text),
        decoration: InputDecoration(
          labelText: label,
          alignLabelWithHint: true,
          counterText: '',
        ),
      ),
    );
  }
}

class _FeedbackCard extends StatelessWidget {
  const _FeedbackCard({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      enableShine: false,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: children
            .expand((w) => [w, const SizedBox(height: 8)])
            .toList()
          ..removeLast(),
      ),
    );
  }
}

class _BulletBlock extends StatelessWidget {
  const _BulletBlock({
    required this.title,
    required this.items,
    this.numbered = false,
  });

  final String title;
  final List<String> items;
  final bool numbered;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (title.isNotEmpty) ...[
          Text(title, style: EzoaTypography.titleSmall(context)),
          const SizedBox(height: 4),
        ],
        ...items.asMap().entries.map((e) {
          final prefix = numbered ? '${e.key + 1}. ' : '• ';
          return Padding(
            padding: const EdgeInsets.only(bottom: 4),
            child: Text('$prefix${e.value}', style: EzoaTypography.bodySmall(context)),
          );
        }),
      ],
    );
  }
}

String _verdictLabel(String verdict) {
  switch (verdict) {
    case 'correct':
      return 'plutôt juste';
    case 'partial':
      return 'partiel';
    default:
      return 'à revoir';
  }
}
