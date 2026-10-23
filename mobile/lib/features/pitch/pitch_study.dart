import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'pitch_data.dart';
import 'pitch_kit.dart';
import 'pitch_money.dart';

/// Épreuve : visionneuse lisible hors ligne + téléchargement.
class SubjectScreen extends StatefulWidget {
  const SubjectScreen({super.key, required this.subject});
  final Subject subject;
  @override
  State<SubjectScreen> createState() => _SubjectScreenState();
}

class _SubjectScreenState extends State<SubjectScreen> {
  late bool _offline = widget.subject.offline;
  double? _progress;

  Future<void> _download() async {
    if (_offline || _progress != null) return;
    for (var i = 1; i <= 20; i++) {
      await Future<void>.delayed(const Duration(milliseconds: 60));
      if (!mounted) return;
      setState(() => _progress = i / 20);
    }
    setState(() {
      _offline = true;
      _progress = null;
    });
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
        behavior: SnackBarBehavior.floating,
        backgroundColor: PK.emerald,
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
        content: Text('Épreuve disponible hors ligne ✓', style: PK.body(context, 14, color: Colors.white, w: FontWeight.w600)),
      ));
    }
  }

  @override
  Widget build(BuildContext context) {
    final s = widget.subject;
    return Scaffold(
      body: PKBackground(
        child: SafeArea(
          child: Column(children: [
            PKTopBar(
              title: s.matiere,
              trailing: PKRoundIcon(Icons.favorite_border_rounded, label: 'Ajouter aux favoris', onTap: () {}),
            ),
            Expanded(
              child: ListView(padding: const EdgeInsets.fromLTRB(PK.pad, 6, PK.pad, 130), children: [
                Wrap(spacing: 8, runSpacing: 8, children: [
                  PKBadge(s.exam, bg: PK.hero(context), fg: Colors.white).badgePop(0),
                  if (s.serie.isNotEmpty) PKBadge(s.serie, bg: PK.surface2(context), fg: PK.ink(context)).badgePop(1),
                  PKBadge('Session ${s.year}', bg: PK.surface2(context), fg: PK.ink(context)).badgePop(2),
                  if (_offline) const PKBadge('Hors ligne', icon: Icons.offline_pin_rounded, bg: PK.lime).badgePop(3),
                ]),
                const SizedBox(height: 14),
                Text(s.title, style: PK.display(context, 26)).reveal(1),
                const SizedBox(height: 14),
                Row(children: [
                  _stat(context, Icons.timer_outlined, s.duree, 'Durée'),
                  const SizedBox(width: 10),
                  _stat(context, Icons.functions_rounded, 'Coef. ${s.coef}', 'Coefficient'),
                  const SizedBox(width: 10),
                  _stat(context, Icons.visibility_outlined, '${(s.views / 1000).toStringAsFixed(1)} k', 'Vues'),
                ]).reveal(2),
                const SizedBox(height: 12),
                PKCard(
                  padding: const EdgeInsets.all(14),
                  child: Row(children: [
                    Icon(Icons.verified_rounded, color: PK.accent(context)),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Vérifiée par un enseignant', style: PK.body(context, 14, w: FontWeight.w700)),
                        Text(s.verifiedBy, style: PK.body(context, 12, color: PK.muted(context))),
                      ]),
                    ),
                  ]),
                ).reveal(3, card: true),
                const SizedBox(height: 16),
                // « Feuille » d'examen
                Container(
                  padding: const EdgeInsets.fromLTRB(20, 22, 20, 22),
                  decoration: BoxDecoration(
                    color: const Color(0xFFFFFDF7),
                    borderRadius: BorderRadius.circular(PK.r),
                    boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.08), blurRadius: 24, offset: const Offset(0, 10))],
                  ),
                  child: DefaultTextStyle(
                    style: const TextStyle(fontFamily: PK.fontBody, color: Color(0xFF1B1F1D), fontSize: 14.5, height: 1.55),
                    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Center(child: Text('RÉPUBLIQUE TOGOLAISE\nTravail – Liberté – Patrie', textAlign: TextAlign.center, style: TextStyle(fontSize: 11, letterSpacing: 1, fontWeight: FontWeight.w700, color: Color(0xFF5B635F)))),
                      const SizedBox(height: 10),
                      Center(child: Text('${s.exam.toUpperCase()} ${s.serie.toUpperCase()} — SESSION ${s.year}', textAlign: TextAlign.center, style: const TextStyle(fontFamily: PK.fontDisplay, fontSize: 16, fontWeight: FontWeight.w700))),
                      Center(child: Text('Épreuve de ${s.matiere} · Durée ${s.duree}', style: const TextStyle(fontSize: 12, color: Color(0xFF5B635F)))),
                      const Divider(height: 28),
                      for (final e in s.exercises) ...[
                        Row(children: [
                          Expanded(child: Text(e.title, style: const TextStyle(fontFamily: PK.fontDisplay, fontWeight: FontWeight.w700, fontSize: 15.5, color: PK.emerald))),
                          Text('${e.points} pts', style: const TextStyle(fontWeight: FontWeight.w700, fontSize: 12, color: Color(0xFF5B635F))),
                        ]),
                        const SizedBox(height: 6),
                        Text(e.statement),
                        const SizedBox(height: 16),
                      ],
                    ]),
                  ),
                ).reveal(4, card: true),
                const SizedBox(height: 14),
                PKCard(
                  color: PK.gold.withValues(alpha: 0.16),
                  onTap: () => Navigator.of(context).push(pkRoute(const PaywallScreen())),
                  child: Row(children: [
                    const Icon(Icons.lock_rounded, color: Color(0xFFB8860B)),
                    const SizedBox(width: 12),
                    Expanded(child: Text('Le corrigé détaillé est réservé aux membres Pro', style: PK.body(context, 14, w: FontWeight.w600))),
                    const PKBadge('PRO'),
                  ]),
                ).reveal(5, card: true),
              ]),
            ),
          ]),
        ),
      ),
      bottomNavigationBar: SafeArea(
        minimum: const EdgeInsets.fromLTRB(PK.pad, 0, PK.pad, 14),
        child: Row(children: [
          Expanded(
            child: _progress != null
                ? Container(
                    height: 56,
                    decoration: BoxDecoration(color: PK.surface2(context), borderRadius: BorderRadius.circular(999)),
                    clipBehavior: Clip.antiAlias,
                    child: Stack(alignment: Alignment.center, children: [
                      Align(alignment: Alignment.centerLeft, child: FractionallySizedBox(widthFactor: _progress, child: Container(color: PK.mint.withValues(alpha: 0.5)))),
                      Text('${(_progress! * 100).round()} %', style: PK.body(context, 15, w: FontWeight.w700)),
                    ]),
                  )
                : PKButton(
                    label: _offline ? 'Hors ligne ✓' : 'Télécharger',
                    icon: _offline ? Icons.offline_pin_rounded : Icons.download_rounded,
                    style: PKButtonStyle.ghost,
                    onTap: _download,
                  ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: PKButton(
              label: 'Tuteur IA',
              icon: Icons.auto_awesome_rounded,
              onTap: () => Navigator.of(context).push(pkRoute(TutorScreen(subject: s))),
            ),
          ),
        ]),
      ),
    );
  }

  Widget _stat(BuildContext context, IconData icon, String v, String l) => Expanded(
        child: PKCard(
          padding: const EdgeInsets.symmetric(vertical: 12, horizontal: 10),
          child: Column(children: [
            Icon(icon, size: 18, color: PK.accent(context)),
            const SizedBox(height: 4),
            Text(v, maxLines: 1, style: PK.body(context, 14, w: FontWeight.w700)),
            Text(l, style: PK.body(context, 11, color: PK.muted(context))),
          ]),
        ),
      );
}

class OfflineScreen extends StatelessWidget {
  const OfflineScreen({super.key});
  @override
  Widget build(BuildContext context) {
    final list = subjects.where((s) => s.offline).toList();
    return Scaffold(
      body: PKBackground(
        child: SafeArea(
          child: ListView(padding: const EdgeInsets.fromLTRB(0, 0, 0, 40), children: [
            const PKTopBar(title: 'Hors ligne'),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: PK.pad),
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Container(
                  padding: const EdgeInsets.all(20),
                  decoration: BoxDecoration(color: PK.hero(context), borderRadius: BorderRadius.circular(28)),
                  child: Row(children: [
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text('Stockage utilisé', style: PK.body(context, 13, color: Colors.white70)),
                        const SizedBox(height: 4),
                        Text('3,8 Mo', style: PK.display(context, 40, color: Colors.white)),
                        const SizedBox(height: 4),
                        Row(children: [
                          const Icon(Icons.wifi_off_rounded, size: 16, color: PK.lime),
                          const SizedBox(width: 6),
                          Text('Lisible sans connexion', style: PK.body(context, 13, color: PK.lime, w: FontWeight.w600)),
                        ]),
                      ]),
                    ),
                    const Icon(Icons.offline_pin_rounded, size: 56, color: PK.lime),
                  ]),
                ).reveal(0, card: true),
                const SizedBox(height: 18),
                Text('${list.length} épreuves téléchargées', style: PK.body(context, 13, color: PK.muted(context), w: FontWeight.w600)).reveal(1),
                const SizedBox(height: 10),
                for (var i = 0; i < list.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PKCard(
                      padding: const EdgeInsets.all(12),
                      onTap: () => Navigator.of(context).push(pkRoute(SubjectScreen(subject: list[i]))),
                      child: Row(children: [
                        Container(width: 48, height: 56, decoration: BoxDecoration(color: PK.mint.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)), child: Icon(Icons.offline_pin_rounded, color: PK.accent(context))),
                        const SizedBox(width: 12),
                        Expanded(child: Text(list[i].title, style: PK.body(context, 15, w: FontWeight.w700))),
                        Text('${list[i].pages} p.', style: PK.body(context, 12, color: PK.muted(context))),
                      ]),
                    ).reveal(2 + i, card: true),
                  ),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

class _Msg {
  _Msg(this.text, this.me);
  final String text;
  final bool me;
}

/// Tuteur IA : guide par questions, ne donne jamais la réponse.
class TutorScreen extends StatefulWidget {
  const TutorScreen({super.key, this.subject});
  final Subject? subject;
  @override
  State<TutorScreen> createState() => _TutorScreenState();
}

class _TutorScreenState extends State<TutorScreen> {
  final _msgs = <_Msg>[];
  final _sc = ScrollController();
  final _tc = TextEditingController();
  int _step = 0;
  bool _typing = false;

  @override
  void initState() {
    super.initState();
    _msgs.add(_Msg('Salut ! Je suis ton tuteur EZOA-TO. Je ne donne pas les réponses : je t\'aide à les trouver toi-même. Sur quel exercice tu bloques ?', false));
  }

  Future<void> _send([String? text]) async {
    if (_typing) return;
    final t = text ?? (_step < tutorScript.length ? tutorScript[_step].$1 : _tc.text.trim());
    if (t.isEmpty) return;
    _tc.clear();
    setState(() {
      _msgs.add(_Msg(t, true));
      _typing = true;
    });
    _scroll();
    await Future<void>.delayed(const Duration(milliseconds: 1300));
    if (!mounted) return;
    final reply = _step < tutorScript.length
        ? tutorScript[_step].$2
        : 'Bonne question ! Avant que je t\'aide : qu\'as-tu déjà essayé ? Écris-moi ta première étape, même si tu n\'es pas sûr 🙂';
    setState(() {
      _msgs.add(_Msg(reply, false));
      _typing = false;
      _step++;
    });
    _scroll();
  }

  void _scroll() => Future<void>.delayed(const Duration(milliseconds: 60), () {
        if (_sc.hasClients) _sc.animateTo(_sc.position.maxScrollExtent + 200, duration: const Duration(milliseconds: 350), curve: Curves.easeOut);
      });

  @override
  Widget build(BuildContext context) {
    final isTab = widget.subject == null;
    final content = SafeArea(
      bottom: !isTab,
      child: Column(children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(PK.pad, 8, PK.pad, 8),
          child: Row(children: [
            if (!isTab) ...[PKRoundIcon(Icons.arrow_back_rounded, label: 'Retour', onTap: () => Navigator.of(context).maybePop()), const SizedBox(width: 12)],
            const _Orb(),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Tuteur IA', style: PK.display(context, 20)),
                Text(widget.subject?.title ?? 'BEPC · Mathématiques 2024', maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 12, color: PK.muted(context))),
              ]),
            ),
            const PKBadge('Guide', icon: Icons.psychology_rounded, bg: PK.lime),
          ]),
        ),
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: PK.pad),
          child: Container(
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            decoration: BoxDecoration(color: PK.gold.withValues(alpha: 0.14), borderRadius: BorderRadius.circular(14)),
            child: Row(children: [
              const Icon(Icons.shield_moon_outlined, size: 16, color: Color(0xFFB8860B)),
              const SizedBox(width: 8),
              Expanded(child: Text('Mode guide : indices et questions, jamais la solution toute faite.', style: PK.body(context, 12, w: FontWeight.w600))),
            ]),
          ),
        ),
        Expanded(
          child: ListView.builder(
            controller: _sc,
            padding: const EdgeInsets.fromLTRB(PK.pad, 14, PK.pad, 14),
            itemCount: _msgs.length + (_typing ? 1 : 0),
            itemBuilder: (_, i) {
              if (i == _msgs.length) return const _Typing();
              final m = _msgs[i];
              return Align(
                alignment: m.me ? Alignment.centerRight : Alignment.centerLeft,
                child: Container(
                  constraints: BoxConstraints(maxWidth: MediaQuery.of(context).size.width * 0.8),
                  margin: const EdgeInsets.only(bottom: 10),
                  padding: const EdgeInsets.symmetric(horizontal: 15, vertical: 12),
                  decoration: BoxDecoration(
                    color: m.me ? PK.emerald : PK.surface(context),
                    border: m.me ? null : Border.all(color: PK.line(context)),
                    borderRadius: BorderRadius.only(
                      topLeft: const Radius.circular(20),
                      topRight: const Radius.circular(20),
                      bottomLeft: Radius.circular(m.me ? 20 : 6),
                      bottomRight: Radius.circular(m.me ? 6 : 20),
                    ),
                  ),
                  child: _rich(context, m.text, m.me ? Colors.white : PK.ink(context)),
                ).animate().fadeIn(duration: 300.ms).moveY(begin: 16, end: 0, duration: 400.ms, curve: Curves.easeOut),
              );
            },
          ),
        ),
        SizedBox(
          height: 44,
          child: ListView.separated(
            padding: const EdgeInsets.symmetric(horizontal: PK.pad),
            scrollDirection: Axis.horizontal,
            itemCount: tutorHints.length + 1,
            separatorBuilder: (_, __) => const SizedBox(width: 8),
            itemBuilder: (_, i) => i == 0 && _step < tutorScript.length
                ? PKChip('✍️ ${tutorScript[_step].$1.length > 28 ? '${tutorScript[_step].$1.substring(0, 28)}…' : tutorScript[_step].$1}', onTap: () => _send())
                : PKChip(tutorHints[(i - 1).clamp(0, tutorHints.length - 1)], onTap: () => _send(tutorHints[(i - 1).clamp(0, tutorHints.length - 1)])),
          ),
        ),
        Padding(
          padding: EdgeInsets.fromLTRB(PK.pad, 10, PK.pad, isTab ? 96 : 10),
          child: Row(children: [
            Expanded(
              child: TextField(
                controller: _tc,
                onSubmitted: (_) => _send(_tc.text.trim().isEmpty ? null : _tc.text.trim()),
                style: PK.body(context, 15),
                decoration: InputDecoration(
                  hintText: 'Écris ta question…',
                  hintStyle: PK.body(context, 15, color: PK.muted(context)),
                  filled: true,
                  fillColor: PK.surface(context),
                  contentPadding: const EdgeInsets.symmetric(horizontal: 18, vertical: 15),
                  border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.line(context))),
                  enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.line(context))),
                  focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.accent(context))),
                ),
              ),
            ),
            const SizedBox(width: 10),
            PKTap(
              onTap: () => _send(_tc.text.trim().isEmpty ? null : _tc.text.trim()),
              semantics: 'Envoyer',
              child: Container(width: 52, height: 52, decoration: const BoxDecoration(color: PK.emerald, shape: BoxShape.circle), child: const Icon(Icons.arrow_upward_rounded, color: Colors.white)),
            ),
          ]),
        ),
      ]),
    );
    return isTab ? content : Scaffold(body: PKBackground(child: content));
  }

  Widget _rich(BuildContext context, String t, Color c) {
    final parts = t.split('**');
    return Text.rich(TextSpan(children: [
      for (var i = 0; i < parts.length; i++) TextSpan(text: parts[i], style: PK.body(context, 14.5, color: c, w: i.isOdd ? FontWeight.w700 : FontWeight.w400, h: 1.45)),
    ]));
  }
}

class _Orb extends StatelessWidget {
  const _Orb();
  @override
  Widget build(BuildContext context) => Container(
        width: 44,
        height: 44,
        decoration: const BoxDecoration(shape: BoxShape.circle, gradient: LinearGradient(colors: [PK.lime, PK.emerald], begin: Alignment.topLeft, end: Alignment.bottomRight)),
        child: const Icon(Icons.auto_awesome_rounded, color: Colors.white, size: 20),
      ).animate(onPlay: (c) => c.repeat(reverse: true)).scaleXY(begin: 1, end: 1.08, duration: 1400.ms, curve: Curves.easeInOut);
}

class _Typing extends StatelessWidget {
  const _Typing();
  @override
  Widget build(BuildContext context) => Align(
        alignment: Alignment.centerLeft,
        child: Container(
          margin: const EdgeInsets.only(bottom: 10),
          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
          decoration: BoxDecoration(color: PK.surface(context), borderRadius: BorderRadius.circular(20), border: Border.all(color: PK.line(context))),
          child: Row(mainAxisSize: MainAxisSize.min, children: [
            for (var i = 0; i < 3; i++)
              Container(margin: const EdgeInsets.symmetric(horizontal: 2), width: 7, height: 7, decoration: BoxDecoration(color: PK.muted(context), shape: BoxShape.circle))
                  .animate(onPlay: (c) => c.repeat(), delay: Duration(milliseconds: 150 * i))
                  .moveY(begin: 0, end: -5, duration: 350.ms)
                  .then()
                  .moveY(begin: -5, end: 0, duration: 350.ms),
          ]),
        ),
      );
}

