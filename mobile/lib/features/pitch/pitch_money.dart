import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_animate/flutter_animate.dart';

import 'pitch_kit.dart';

/// Contribuer : envoyer un sujet, suivre la vérification, être payé.
class ContributeScreen extends StatefulWidget {
  const ContributeScreen({super.key});
  @override
  State<ContributeScreen> createState() => _ContributeScreenState();
}

class _ContributeScreenState extends State<ContributeScreen> {
  String _exam = 'BEPC';
  bool _sent = false;

  @override
  Widget build(BuildContext context) {
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.fromLTRB(PK.pad, 16, PK.pad, 120), children: [
        Text('Partager & gagner', style: PK.display(context, 30)).reveal(0),
        const SizedBox(height: 6),
        Text('Envoie tes anciens sujets. Un enseignant les vérifie, tu es payé sur Mobile Money.', style: PK.body(context, 14, color: PK.muted(context))).reveal(1),
        const SizedBox(height: 16),
        Container(
          padding: const EdgeInsets.all(22),
          decoration: BoxDecoration(color: PK.hero(context), borderRadius: BorderRadius.circular(28)),
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Row(children: [
              Text('Mes gains', style: PK.body(context, 13, color: Colors.white70)),
              const Spacer(),
              const PKBadge('Flooz · T-Money', bg: PK.lime),
            ]),
            const SizedBox(height: 6),
            Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
              Text('12\u202F500', style: PK.display(context, 46, color: Colors.white)),
              const SizedBox(width: 6),
              Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('FCFA', style: PK.body(context, 15, color: Colors.white54))),
            ]),
            const SizedBox(height: 4),
            Text('25 sujets validés · 500 FCFA par sujet', style: PK.body(context, 13, color: PK.lime, w: FontWeight.w600)),
            const SizedBox(height: 16),
            PKButton(label: 'Retirer sur Mobile Money', icon: Icons.account_balance_wallet_rounded, style: PKButtonStyle.gold, onTap: () => Navigator.of(context).push(pkRoute(const PayoutScreen()))),
          ]),
        ).reveal(2, card: true),
        const SizedBox(height: 22),
        PKSectionTitle('Nouveau sujet').reveal(3),
        const SizedBox(height: 12),
        PKCard(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('Examen', style: PK.body(context, 13, color: PK.muted(context), w: FontWeight.w600)),
            const SizedBox(height: 8),
            Wrap(spacing: 8, runSpacing: 8, children: [
              for (final e in ['CEPD', 'BEPC', 'BAC I', 'BAC II', 'Devoir', 'Concours']) PKChip(e, selected: _exam == e, onTap: () => setState(() => _exam = e)),
            ]),
            const SizedBox(height: 16),
            Row(children: [
              Expanded(child: _field(context, 'Matière', 'Mathématiques')),
              const SizedBox(width: 10),
              Expanded(child: _field(context, 'Année', '2025')),
            ]),
            const SizedBox(height: 16),
            PKTap(
              onTap: () => setState(() => _sent = true),
              semantics: 'Scanner le sujet',
              child: Container(
                height: 130,
                width: double.infinity,
                decoration: BoxDecoration(
                  color: PK.mint.withValues(alpha: 0.08),
                  borderRadius: BorderRadius.circular(20),
                  border: Border.all(color: PK.accent(context).withValues(alpha: 0.5), width: 1.5),
                ),
                child: Column(mainAxisAlignment: MainAxisAlignment.center, children: [
                  Icon(_sent ? Icons.check_circle_rounded : Icons.document_scanner_rounded, size: 34, color: PK.accent(context)),
                  const SizedBox(height: 8),
                  Text(_sent ? '3 pages scannées · prêtes à envoyer' : 'Scanner ou importer le sujet', style: PK.body(context, 14, w: FontWeight.w600)),
                  Text('Photo, PDF · recadrage automatique', style: PK.body(context, 12, color: PK.muted(context))),
                ]),
              ),
            ),
            const SizedBox(height: 16),
            PKButton(
              label: _sent ? 'Envoyer pour vérification' : 'Scanner d\'abord',
              icon: Icons.send_rounded,
              onTap: _sent
                  ? () {
                      HapticFeedback.mediumImpact();
                      ScaffoldMessenger.of(context).showSnackBar(SnackBar(
                        behavior: SnackBarBehavior.floating,
                        backgroundColor: PK.emerald,
                        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                        content: Text('Sujet envoyé ! Vérification sous 48 h. +500 FCFA à la validation.', style: PK.body(context, 14, color: Colors.white, w: FontWeight.w600)),
                      ));
                      setState(() => _sent = false);
                    }
                  : null,
            ),
          ]),
        ).reveal(4, card: true),
        const SizedBox(height: 22),
        PKSectionTitle('Mes envois').reveal(5),
        const SizedBox(height: 12),
        _sub(context, 'BEPC · Maths 2023', 'Validé · +500 FCFA', Icons.check_circle_rounded, PK.accent(context), 6),
        _sub(context, 'BAC II D · Philo 2024', 'En vérification par un enseignant', Icons.hourglass_top_rounded, const Color(0xFF8A6D00), 7),
        _sub(context, 'CEPD · Calcul 2022', 'Validé · +500 FCFA', Icons.check_circle_rounded, PK.accent(context), 8),
      ]),
    );
  }

  Widget _field(BuildContext context, String l, String v) => Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(l, style: PK.body(context, 13, color: PK.muted(context), w: FontWeight.w600)),
        const SizedBox(height: 8),
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 14),
          alignment: Alignment.centerLeft,
          decoration: BoxDecoration(color: PK.surface2(context), borderRadius: BorderRadius.circular(14)),
          child: Text(v, style: PK.body(context, 15, w: FontWeight.w600)),
        ),
      ]);

  Widget _sub(BuildContext context, String t, String s, IconData i, Color c, int k) => Padding(
        padding: const EdgeInsets.only(bottom: 10),
        child: PKCard(
          padding: const EdgeInsets.all(14),
          child: Row(children: [
            Icon(i, color: c),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text(t, style: PK.body(context, 15, w: FontWeight.w600)),
                Text(s, style: PK.body(context, 12, color: PK.muted(context))),
              ]),
            ),
          ]),
        ).reveal(k),
      );
}

/// Paywall Pro.
class PaywallScreen extends StatefulWidget {
  const PaywallScreen({super.key});
  @override
  State<PaywallScreen> createState() => _PaywallScreenState();
}

class _PaywallScreenState extends State<PaywallScreen> {
  int _plan = 0;
  static const _plans = [('Mensuel', 1000, 'par mois', ''), ('Trimestre', 2500, '3 mois', '−17 %'), ('Année scolaire', 8000, '10 mois', '−20 %')];

  @override
  Widget build(BuildContext context) {
    final feats = [
      (Icons.task_alt_rounded, 'Corrigés détaillés de toutes les épreuves'),
      (Icons.auto_awesome_rounded, 'Tuteur IA illimité, 24 h/24'),
      (Icons.download_for_offline_rounded, 'Téléchargements hors ligne illimités'),
      (Icons.insights_rounded, 'Suivi de progression et objectifs'),
    ];
    return Scaffold(
      body: PKBackground(
        child: SafeArea(
          child: Column(children: [
            const PKTopBar(title: 'EZOA-TO Pro'),
            Expanded(
              child: ListView(padding: const EdgeInsets.fromLTRB(PK.pad, 6, PK.pad, 20), children: [
                Container(
                  padding: const EdgeInsets.all(22),
                  decoration: BoxDecoration(
                    borderRadius: BorderRadius.circular(28),
                    color: PK.emerald,
                  ),
                  child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                    const PKBadge('PRO', icon: Icons.bolt_rounded).badgePop(1),
                    const SizedBox(height: 12),
                    Text('Révise comme\nun major de promo', style: PK.display(context, 30, color: Colors.white)),
                    const SizedBox(height: 8),
                    Text('Moins cher qu\'un cahier par mois.', style: PK.body(context, 14, color: Colors.white70)),
                  ]),
                ).reveal(0, card: true),
                const SizedBox(height: 16),
                for (var i = 0; i < feats.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: Row(children: [
                      Container(width: 38, height: 38, decoration: BoxDecoration(color: PK.mint.withValues(alpha: 0.16), shape: BoxShape.circle), child: Icon(feats[i].$1, size: 19, color: PK.accent(context))),
                      const SizedBox(width: 12),
                      Expanded(child: Text(feats[i].$2, style: PK.body(context, 14.5, w: FontWeight.w600))),
                    ]).reveal(1 + i),
                  ),
                const SizedBox(height: 10),
                for (var i = 0; i < _plans.length; i++)
                  Padding(
                    padding: const EdgeInsets.only(bottom: 10),
                    child: PKTap(
                      onTap: () => setState(() => _plan = i),
                      semantics: _plans[i].$1,
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 250),
                        padding: const EdgeInsets.all(16),
                        decoration: BoxDecoration(
                          color: PK.surface(context),
                          borderRadius: BorderRadius.circular(PK.r),
                          border: Border.all(color: _plan == i ? PK.accent(context) : PK.line(context), width: _plan == i ? 2 : 1),
                        ),
                        child: Row(children: [
                          AnimatedContainer(
                            duration: const Duration(milliseconds: 250),
                            width: 22,
                            height: 22,
                            decoration: BoxDecoration(shape: BoxShape.circle, color: _plan == i ? PK.accent(context) : Colors.transparent, border: Border.all(color: _plan == i ? PK.accent(context) : PK.muted(context), width: 2)),
                            child: _plan == i ? Icon(Icons.check, size: 14, color: PK.bg(context)) : null,
                          ),
                          const SizedBox(width: 12),
                          Expanded(
                            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                              Row(children: [
                                Text(_plans[i].$1, style: PK.body(context, 15, w: FontWeight.w700)),
                                if (_plans[i].$4.isNotEmpty) ...[const SizedBox(width: 8), PKBadge(_plans[i].$4)],
                              ]),
                              Text(_plans[i].$3, style: PK.body(context, 12, color: PK.muted(context))),
                            ]),
                          ),
                          Text(fcfa(_plans[i].$2), style: PK.display(context, 17)),
                        ]),
                      ),
                    ).reveal(5 + i, card: true),
                  ),
              ]),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(PK.pad, 6, PK.pad, 14),
              child: PKButton(
                label: 'Continuer · ${fcfa(_plans[_plan].$2)}',
                icon: Icons.lock_rounded,
                onTap: () => Navigator.of(context).push(pkRoute(CheckoutScreen(title: 'Abonnement Pro', item: 'EZOA-TO Pro · ${_plans[_plan].$1}', amount: _plans[_plan].$2))),
              ),
            ),
          ]),
        ),
      ),
    );
  }
}

class PayoutScreen extends StatelessWidget {
  const PayoutScreen({super.key});
  @override
  Widget build(BuildContext context) => const CheckoutScreen(title: 'Retrait de gains', item: 'Gains contributeur · 25 sujets', amount: 12500, payout: true);
}

/// Écran de paiement façon DcGgytAzym7 : carte sombre, bouton « Payer »,
/// anneaux concentriques verts (charte) qui pulsent avec le pourcentage, puis
/// passage au vert avec une coche et le montant.
class CheckoutScreen extends StatefulWidget {
  const CheckoutScreen({super.key, required this.title, required this.item, required this.amount, this.payout = false});
  final String title;
  final String item;
  final int amount;
  final bool payout;
  @override
  State<CheckoutScreen> createState() => _CheckoutScreenState();
}

enum _Phase { form, processing, success }

class _CheckoutScreenState extends State<CheckoutScreen> with TickerProviderStateMixin {
  _Phase _phase = _Phase.form;
  int _op = 0;
  late final AnimationController _prog;
  late final AnimationController _pulse;

  @override
  void initState() {
    super.initState();
    _prog = AnimationController(vsync: this, duration: const Duration(milliseconds: 2600));
    _pulse = AnimationController(vsync: this, duration: const Duration(milliseconds: 1600))..repeat();
  }
  static const _ops = [('Flooz', 'Moov Africa', Color(0xFF006A4E)), ('T-Money', 'Togocom', Color(0xFFFFCE00))];
  static const _bg = Color(0xFF081221);
  static const _card = Color(0xFF101D2F);

  @override
  void dispose() {
    _prog.dispose();
    _pulse.dispose();
    super.dispose();
  }

  Future<void> _pay() async {
    HapticFeedback.mediumImpact();
    setState(() => _phase = _Phase.processing);
    await _prog.forward(from: 0);
    if (!mounted) return;
    HapticFeedback.heavyImpact();
    setState(() => _phase = _Phase.success);
  }

  @override
  Widget build(BuildContext context) {
    return Theme(
      data: ThemeData.dark(),
      child: Scaffold(
        backgroundColor: _bg,
        body: SafeArea(
          child: AnimatedSwitcher(
            duration: const Duration(milliseconds: 450),
            switchInCurve: Curves.easeOut,
            transitionBuilder: (c, a) => FadeTransition(opacity: a, child: ScaleTransition(scale: Tween(begin: 0.96, end: 1.0).animate(a), child: c)),
            child: switch (_phase) {
              _Phase.form => _form(context),
              _Phase.processing => _processing(context),
              _Phase.success => _success(context),
            },
          ),
        ),
      ),
    );
  }

  Widget _form(BuildContext context) {
    final w = Colors.white;
    return Column(key: const ValueKey('form'), children: [
      Padding(
        padding: const EdgeInsets.fromLTRB(PK.pad, 8, PK.pad, 8),
        child: Row(children: [
          PKTap(onTap: () => Navigator.of(context).maybePop(), semantics: 'Retour', child: Container(width: 44, height: 44, decoration: const BoxDecoration(color: _card, shape: BoxShape.circle), child: const Icon(Icons.arrow_back_rounded, color: Colors.white))),
          const SizedBox(width: 14),
          Expanded(child: Text(widget.title, style: PK.display(context, 20, color: w))),
          const Icon(Icons.lock_outline_rounded, color: Colors.white54, size: 20),
        ]),
      ),
      Expanded(
        child: ListView(padding: const EdgeInsets.fromLTRB(PK.pad, 10, PK.pad, 20), children: [
          Text(widget.payout ? 'Recevoir sur' : 'Payer avec', style: PK.body(context, 13, color: Colors.white54, w: FontWeight.w600)).reveal(0),
          const SizedBox(height: 10),
          for (var i = 0; i < _ops.length; i++)
            Padding(
              padding: const EdgeInsets.only(bottom: 10),
              child: PKTap(
                onTap: () => setState(() => _op = i),
                semantics: _ops[i].$1,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 250),
                  padding: const EdgeInsets.all(14),
                  decoration: BoxDecoration(color: _card, borderRadius: BorderRadius.circular(18), border: Border.all(color: _op == i ? PK.mint : Colors.white10, width: _op == i ? 2 : 1)),
                  child: Row(children: [
                    Container(
                      width: 46,
                      height: 32,
                      alignment: Alignment.center,
                      decoration: BoxDecoration(color: _ops[i].$3, borderRadius: BorderRadius.circular(8)),
                      child: Text(_ops[i].$1.substring(0, 1), style: TextStyle(fontFamily: PK.fontDisplay, fontWeight: FontWeight.w800, color: i == 1 ? Colors.black : Colors.white)),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(_ops[i].$1, style: PK.body(context, 15, color: w, w: FontWeight.w700)),
                        Text('${_ops[i].$2} · +228 •• •• 42 17', style: PK.body(context, 12, color: Colors.white54)),
                      ]),
                    ),
                    Icon(_op == i ? Icons.radio_button_checked_rounded : Icons.radio_button_off_rounded, color: _op == i ? PK.mint : Colors.white38),
                  ]),
                ),
              ).reveal(1 + i, card: true),
            ),
          const SizedBox(height: 14),
          Text(widget.payout ? 'Montant à retirer' : 'Montant', style: PK.body(context, 13, color: Colors.white54, w: FontWeight.w600)).reveal(3),
          const SizedBox(height: 4),
          Text(fcfa(widget.amount), style: PK.display(context, 40, color: w)).reveal(4),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.all(16),
            decoration: BoxDecoration(color: _card, borderRadius: BorderRadius.circular(18), border: Border.all(color: Colors.white10)),
            child: Column(children: [
              _line(context, 'Récapitulatif', '', bold: true),
              const SizedBox(height: 10),
              _line(context, widget.item, fcfa(widget.amount)),
              const SizedBox(height: 6),
              _line(context, 'Frais', '0 FCFA'),
              const Divider(color: Colors.white12, height: 22),
              _line(context, 'Total', fcfa(widget.amount), bold: true),
            ]),
          ).reveal(5, card: true),
        ]),
      ),
      Padding(
        padding: const EdgeInsets.fromLTRB(PK.pad, 6, PK.pad, 14),
        child: PKTap(
          onTap: _pay,
          semantics: widget.payout ? 'Retirer' : 'Payer',
          child: Container(
            height: 56,
            decoration: BoxDecoration(color: PK.emerald, borderRadius: BorderRadius.circular(16), boxShadow: [BoxShadow(color: PK.emerald.withValues(alpha: 0.45), blurRadius: 24, offset: const Offset(0, 8))]),
            child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
              const Icon(Icons.lock_rounded, color: Colors.white, size: 18),
              const SizedBox(width: 8),
              Text(widget.payout ? 'Retirer ${fcfa(widget.amount)}' : 'Payer ${fcfa(widget.amount)}', style: PK.body(context, 16, color: Colors.white, w: FontWeight.w700)),
            ]),
          ),
        ),
      ),
    ]);
  }

  Widget _line(BuildContext context, String a, String b, {bool bold = false}) => Row(children: [
        Expanded(child: Text(a, style: PK.body(context, 14, color: bold ? Colors.white : Colors.white60, w: bold ? FontWeight.w700 : FontWeight.w400))),
        Text(b, style: PK.body(context, 14, color: Colors.white, w: bold ? FontWeight.w700 : FontWeight.w500)),
      ]);

  Widget _processing(BuildContext context) => Center(
        key: const ValueKey('proc'),
        child: AnimatedBuilder(
          animation: Listenable.merge([_prog, _pulse]),
          builder: (_, __) {
            final p = _prog.value;
            final done = p > 0.97;
            final color = Color.lerp(PK.mint, const Color(0xFF02A671), ((p - 0.85) / 0.15).clamp(0, 1))!;
            return Column(mainAxisSize: MainAxisSize.min, children: [
              SizedBox(
                width: 260,
                height: 260,
                child: CustomPaint(
                  painter: _RingsPainter(pulse: _pulse.value, progress: p, color: color),
                  child: Center(
                    child: AnimatedContainer(
                      duration: const Duration(milliseconds: 300),
                      width: 64,
                      height: 64,
                      decoration: BoxDecoration(color: color, borderRadius: BorderRadius.circular(done ? 32 : 16)),
                      child: Icon(done ? Icons.check_rounded : (p < 0.4 ? Icons.account_balance_wallet_rounded : Icons.lock_rounded), color: Colors.white, size: 30),
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 18),
              Text(p < 0.4 ? 'Connexion à ${_ops[_op].$1}…' : (p < 0.85 ? 'Validation sécurisée…' : 'Confirmation…'), style: PK.body(context, 14, color: Colors.white60)),
              const SizedBox(height: 4),
              Text('${(p * 100).round()} %', style: PK.display(context, 22, color: Colors.white)),
            ]);
          },
        ),
      );

  Widget _success(BuildContext context) => Padding(
        key: const ValueKey('ok'),
        padding: const EdgeInsets.all(PK.pad),
        child: Column(children: [
          const Spacer(),
          SizedBox(
            width: 200,
            height: 200,
            child: AnimatedBuilder(
              animation: _pulse,
              builder: (_, __) => CustomPaint(
                painter: _RingsPainter(pulse: _pulse.value, progress: 1, color: const Color(0xFF02A671), soft: true),
                child: Center(
                  child: Container(
                    width: 76,
                    height: 76,
                    decoration: BoxDecoration(color: const Color(0xFF02A671), shape: BoxShape.circle, boxShadow: [BoxShadow(color: const Color(0xFF02A671).withValues(alpha: 0.5), blurRadius: 30)]),
                    child: const Icon(Icons.check_rounded, color: Colors.white, size: 42),
                  ).animate().scaleXY(begin: 0.4, end: 1, duration: 500.ms, curve: Curves.easeOutBack),
                ),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(widget.payout ? 'Retrait envoyé !' : 'Paiement réussi', style: PK.display(context, 24, color: Colors.white)).reveal(1),
          const SizedBox(height: 6),
          Text(fcfa(widget.amount), style: PK.display(context, 38, color: const Color(0xFF02A671))).reveal(2),
          const SizedBox(height: 10),
          Text(
            widget.payout ? 'Tu vas recevoir un SMS ${_ops[_op].$1} de confirmation.' : 'Bienvenue dans EZOA-TO Pro 🎉\nCorrigés et tuteur illimité débloqués.',
            textAlign: TextAlign.center,
            style: PK.body(context, 14, color: Colors.white60),
          ).reveal(3),
          const SizedBox(height: 14),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
            decoration: BoxDecoration(color: _card, borderRadius: BorderRadius.circular(999)),
            child: Text('Réf. EZ-${DateTime.now().millisecondsSinceEpoch % 1000000}', style: PK.body(context, 12, color: Colors.white54, w: FontWeight.w600)),
          ).reveal(4),
          const Spacer(),
          PKTap(
            onTap: () => Navigator.of(context).popUntil((r) => r.isFirst),
            semantics: 'Terminé',
            child: Container(
              height: 56,
              alignment: Alignment.center,
              decoration: BoxDecoration(color: _card, borderRadius: BorderRadius.circular(16), border: Border.all(color: Colors.white12)),
              child: Text('Terminé', style: PK.body(context, 16, color: Colors.white, w: FontWeight.w700)),
            ),
          ).reveal(5),
        ]),
      );
}

class _RingsPainter extends CustomPainter {
  _RingsPainter({required this.pulse, required this.progress, required this.color, this.soft = false});
  final double pulse;
  final double progress;
  final Color color;
  final bool soft;
  @override
  void paint(Canvas canvas, Size size) {
    final c = size.center(Offset.zero);
    final maxR = size.width / 2;
    for (var i = 0; i < 4; i++) {
      final t = (pulse + i / 4) % 1;
      final r = maxR * (0.35 + 0.65 * t);
      canvas.drawCircle(c, r, Paint()..color = color.withValues(alpha: (soft ? 0.25 : 0.45) * (1 - t)));
    }
    canvas.drawCircle(c, maxR * 0.42, Paint()..color = color.withValues(alpha: 0.18));
    if (!soft) {
      final rect = Rect.fromCircle(center: c, radius: maxR * 0.42);
      canvas.drawArc(rect, -math.pi / 2, 2 * math.pi * progress, false, Paint()
        ..color = color
        ..style = PaintingStyle.stroke
        ..strokeWidth = 4
        ..strokeCap = StrokeCap.round);
    }
  }

  @override
  bool shouldRepaint(covariant _RingsPainter o) => o.pulse != pulse || o.progress != progress || o.color != color;
}
