import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

class _Bubble {
  const _Bubble({required this.role, required this.text});

  final String role;
  final String text;
}

const _intro =
    "Indique l'épreuve : son nom, l'examen, l'année, l'établissement, ou colle un lien du catalogue. "
    "Je la cherche dans Ezoato, puis tu confirmes. Je ne donnerai pas le corrigé.";

String _phaseLabel(String phase) {
  switch (phase) {
    case 'confirm':
      return "Confirmer l'épreuve";
    case 'exercise':
      return "Choisir l'exercice";
    case 'guide':
      return 'Exercice guidé';
    case 'remediate':
      return 'Notion du cours';
    default:
      return "Choisir l'épreuve";
  }
}

class GuideTutorPanel extends ConsumerStatefulWidget {
  const GuideTutorPanel({super.key, this.epreuveId});

  final String? epreuveId;

  @override
  ConsumerState<GuideTutorPanel> createState() => _GuideTutorPanelState();
}

class _GuideTutorPanelState extends ConsumerState<GuideTutorPanel> {
  final _input = TextEditingController();
  final _scroll = ScrollController();
  String? _sessionId;
  String _phase = 'identify';
  List<AiGuideCandidate> _candidates = const [];
  AiGuideCandidate? _epreuve;
  String? _exercise;
  List<_Bubble> _bubbles = const [_Bubble(role: 'tutor', text: _intro)];
  bool _busy = false;
  bool _bootstrapped = false;

  @override
  void initState() {
    super.initState();
    if (widget.epreuveId != null) {
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_bootstrapped) return;
        _bootstrapped = true;
        _send(epreuveId: widget.epreuveId, silent: true);
      });
    }
  }

  @override
  void dispose() {
    _input.dispose();
    _scroll.dispose();
    super.dispose();
  }

  void _toast(String msg) {
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
  }

  Future<void> _send({
    String? message,
    String? epreuveId,
    String? candidateId,
    bool silent = false,
  }) async {
    final text = message?.trim() ?? '';
    if (!silent && candidateId == null && epreuveId == null && text.isEmpty) return;
    setState(() {
      _busy = true;
      if (!silent && text.isNotEmpty) {
        _bubbles = [..._bubbles, _Bubble(role: 'eleve', text: text)];
        _input.clear();
      }
    });
    try {
      final turn = await ref.read(apiClientProvider).guideAiTurn(
            sessionId: _sessionId,
            message: text.isEmpty ? null : text,
            epreuveId: epreuveId,
            candidateId: candidateId,
          );
      if (!mounted) return;
      setState(() {
        _sessionId = turn.sessionId;
        _phase = turn.phase;
        _candidates = turn.candidates;
        _epreuve = turn.epreuve;
        _exercise = turn.exercise;
        final base = _bubbles.length == 1 && _bubbles.first.text == _intro
            ? <_Bubble>[]
            : _bubbles;
        _bubbles = [...base, _Bubble(role: 'tutor', text: turn.reply)];
      });
      WidgetsBinding.instance.addPostFrameCallback((_) {
        if (_scroll.hasClients) {
          _scroll.jumpTo(_scroll.position.maxScrollExtent);
        }
      });
    } catch (e) {
      if (mounted) _toast('$e');
    } finally {
      if (mounted) setState(() => _busy = false);
    }
  }

  String get _hint {
    switch (_phase) {
      case 'confirm':
        return "Oui, non, ou le numéro de l'épreuve…";
      case 'exercise':
        return "Numéro ou énoncé de la question…";
      case 'remediate':
        return 'Ce que tu as compris de la notion…';
      case 'guide':
        return 'Où tu en es, une étape…';
      default:
        return 'Nom, examen, année, établissement ou lien…';
    }
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text(
          "Le tuteur t'aide à chercher toi-même. Il ne donne ni la réponse finale ni le corrigé.",
          style: EzoaTypography.bodySmall(context),
        ),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          runSpacing: 8,
          children: [
            Chip(label: Text(_phaseLabel(_phase), style: EzoaTypography.bodySmall(context))),
            if (_epreuve != null)
              Chip(label: Text(_epreuve!.titre, style: EzoaTypography.bodySmall(context))),
            if (_exercise != null && _phase != 'exercise')
              Chip(label: Text('Exercice en cours', style: EzoaTypography.bodySmall(context))),
          ],
        ),
        const SizedBox(height: 8),
        ConstrainedBox(
          constraints: const BoxConstraints(maxHeight: 280),
          child: ListView(
            controller: _scroll,
            shrinkWrap: true,
            children: [
              for (final b in _bubbles)
                Align(
                  alignment: b.role == 'eleve' ? Alignment.centerRight : Alignment.centerLeft,
                  child: Container(
                    margin: const EdgeInsets.only(bottom: 8),
                    padding: const EdgeInsets.all(10),
                    constraints: const BoxConstraints(maxWidth: 320),
                    decoration: BoxDecoration(
                      color: b.role == 'eleve'
                          ? pal.accent.withValues(alpha: 0.12)
                          : pal.surfaceSolid,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(color: pal.border),
                    ),
                    child: Text(b.text, style: EzoaTypography.bodySmall(context)),
                  ),
                ),
              if (_busy)
                const Padding(
                  padding: EdgeInsets.symmetric(vertical: 8),
                  child: Center(child: EzoaGlassLoader()),
                ),
            ],
          ),
        ),
        if (_phase == 'confirm')
          ..._candidates.asMap().entries.map(
                (entry) => Padding(
                  padding: const EdgeInsets.only(bottom: 8),
                  child: EzoaButton(
                    label: '${entry.key + 1}. ${entry.value.line}',
                    variant: EzoaButtonVariant.outline,
                    onPressed: _busy
                        ? null
                        : () => _send(
                              candidateId: entry.value.id,
                              message: "C'est celle-ci : ${entry.value.titre}",
                            ),
                  ),
                ),
              ),
        TextField(
          controller: _input,
          minLines: 2,
          maxLines: 5,
          maxLength: 2000,
          enabled: !_busy,
          style: EzoaTypography.bodySmall(context).copyWith(color: pal.text),
          decoration: InputDecoration(
            hintText: _hint,
            alignLabelWithHint: true,
            counterText: '',
          ),
          onSubmitted: _busy ? null : (value) => _send(message: value),
        ),
        const SizedBox(height: 8),
        EzoaButton(
          label: 'Envoyer',
          loading: _busy,
          onPressed: _busy ? null : () => _send(message: _input.text),
        ),
      ],
    );
  }
}
