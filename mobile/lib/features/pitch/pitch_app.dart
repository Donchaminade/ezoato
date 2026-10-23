import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/theme/theme_mode_provider.dart';
import 'pitch_data.dart';
import 'pitch_kit.dart';
import 'pitch_money.dart';
import 'pitch_study.dart';

/// Point d'entrée de l'expérience de démonstration (pitch).
class PitchOnboarding extends StatefulWidget {
  const PitchOnboarding({super.key});
  @override
  State<PitchOnboarding> createState() => _PitchOnboardingState();
}

class _PitchOnboardingState extends State<PitchOnboarding> {
  final _pc = PageController();
  int _i = 0;
  static const _slides = [
    ('assets/images/onboarding/01-archives-search.png', 'Toutes les épreuves\ndu Togo, au même endroit', 'CEPD, BEPC, BAC, devoirs, compositions, examens universitaires et concours comme l\'ENAM.'),
    ('assets/images/onboarding/04-offline-levels.png', 'Révise même\nsans connexion', 'Télécharge une épreuve une fois, révise partout : au village, dans le bus, sans data.'),
    ('assets/images/onboarding/02-submit-contribute.png', 'Un tuteur IA qui\nte fait réfléchir', 'Il te guide pas à pas avec des questions et des indices, sans jamais te donner la réponse.'),
    ('assets/images/onboarding/03-pro-mobile-money.png', 'Partage tes sujets,\nsois payé', 'Chaque sujet vérifié par un enseignant te rapporte de l\'argent sur Flooz ou T-Money.'),
  ];

  void _next() {
    if (_i < _slides.length - 1) {
      _pc.nextPage(duration: const Duration(milliseconds: 450), curve: Curves.easeOutCubic);
    } else {
      Navigator.of(context).pushReplacement(pkRoute(const PitchShell()));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: PKBackground(
        child: SafeArea(
          child: Column(children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(PK.pad, 12, PK.pad, 0),
              child: Row(children: [
                Image.asset('assets/images/icon-ezoa.png', width: 34, height: 34),
                const SizedBox(width: 10),
                Text('EZOA-TO', style: PK.display(context, 18)),
                const Spacer(),
                PKTap(
                  onTap: () => Navigator.of(context).pushReplacement(pkRoute(const PitchShell())),
                  semantics: 'Passer',
                  child: Padding(padding: const EdgeInsets.all(8), child: Text('Passer', style: PK.body(context, 14, color: PK.muted(context), w: FontWeight.w600))),
                ),
              ]),
            ),
            Expanded(
              child: PageView.builder(
                controller: _pc,
                itemCount: _slides.length,
                onPageChanged: (v) => setState(() => _i = v),
                itemBuilder: (_, i) {
                  final s = _slides[i];
                  return LayoutBuilder(builder: (context, c) {
                    return SingleChildScrollView(
                      padding: const EdgeInsets.symmetric(horizontal: PK.pad),
                      child: ConstrainedBox(
                        constraints: BoxConstraints(minHeight: c.maxHeight),
                        child: Column(mainAxisAlignment: MainAxisAlignment.center, crossAxisAlignment: CrossAxisAlignment.start, children: [
                          AspectRatio(
                            aspectRatio: 1.05,
                            child: Container(
                              decoration: BoxDecoration(color: const Color(0xFFFCFCFA), borderRadius: BorderRadius.circular(32)),
                              clipBehavior: Clip.antiAlias,
                              child: Image.asset(s.$1, fit: BoxFit.cover),
                            ),
                          ).reveal(0, card: true),
                          const SizedBox(height: 28),
                          Text(s.$2, style: PK.display(context, 30)).reveal(1),
                          const SizedBox(height: 12),
                          Text(s.$3, style: PK.body(context, 16, color: PK.muted(context))).reveal(2),
                        ]),
                      ),
                    );
                  });
                },
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(PK.pad, 8, PK.pad, 20),
              child: Row(children: [
                for (var k = 0; k < _slides.length; k++)
                  AnimatedContainer(
                    duration: const Duration(milliseconds: 300),
                    margin: const EdgeInsets.only(right: 6),
                    width: k == _i ? 26 : 8,
                    height: 8,
                    decoration: BoxDecoration(color: k == _i ? PK.accent(context) : PK.line(context), borderRadius: BorderRadius.circular(9)),
                  ),
                const Spacer(),
                PKButton(label: _i == _slides.length - 1 ? 'Commencer' : 'Suivant', icon: Icons.arrow_forward_rounded, expand: false, onTap: _next),
              ]),
            ),
          ]),
        ),
      ),
    );
  }
}

class PitchShell extends StatefulWidget {
  const PitchShell({super.key});
  @override
  State<PitchShell> createState() => _PitchShellState();
}

class _PitchShellState extends State<PitchShell> {
  int _tab = 0;
  void go(int i) => setState(() => _tab = i);

  @override
  Widget build(BuildContext context) {
    final pages = [
      PitchHome(onTab: go),
      const PitchArchives(),
      const TutorScreen(),
      const ContributeScreen(),
      const PitchProfile(),
    ];
    return Scaffold(
      extendBody: true,
      body: PKBackground(child: IndexedStack(index: _tab, children: pages)),
      bottomNavigationBar: _PKTabBar(index: _tab, onTap: go),
    );
  }
}

class _PKTabBar extends StatelessWidget {
  const _PKTabBar({required this.index, required this.onTap});
  final int index;
  final ValueChanged<int> onTap;
  static const _items = [
    (Icons.home_rounded, 'Accueil'),
    (Icons.search_rounded, 'Archives'),
    (Icons.auto_awesome_rounded, 'Tuteur'),
    (Icons.upload_rounded, 'Partager'),
    (Icons.person_rounded, 'Profil'),
  ];
  @override
  Widget build(BuildContext context) {
    final barBg = PK.dark(context) ? const Color(0xFF1C2A3C) : const Color(0xFF004D38);
    return SafeArea(
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      child: Container(
        height: 66,
        padding: const EdgeInsets.all(7),
        decoration: BoxDecoration(
          color: barBg,
          borderRadius: BorderRadius.circular(999),
          boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 30, offset: const Offset(0, 10))],
        ),
        child: Row(children: [
          for (var i = 0; i < _items.length; i++)
            Expanded(
              flex: i == index ? 5 : 3,
              child: PKTap(
                onTap: () => onTap(i),
                semantics: _items[i].$2,
                child: AnimatedContainer(
                  duration: const Duration(milliseconds: 320),
                  curve: Curves.easeOutCubic,
                  height: double.infinity,
                  decoration: BoxDecoration(color: i == index ? PK.lime : Colors.transparent, borderRadius: BorderRadius.circular(999)),
                  child: Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                    Icon(_items[i].$1, size: 21, color: i == index ? const Color(0xFF0B121A) : Colors.white70),
                    if (i == index) ...[
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(_items[i].$2, maxLines: 1, overflow: TextOverflow.clip, softWrap: false,
                            style: const TextStyle(fontFamily: PK.fontBody, fontSize: 13, fontWeight: FontWeight.w700, color: Color(0xFF0B121A))),
                      ),
                    ],
                  ]),
                ),
              ),
            ),
        ]),
      ),
    );
  }
}

class PitchHome extends StatelessWidget {
  const PitchHome({super.key, required this.onTab});
  final ValueChanged<int> onTab;
  @override
  Widget build(BuildContext context) {
    final hero = PK.hero(context);
    return SafeArea(
      bottom: false,
      child: ListView(
        padding: const EdgeInsets.fromLTRB(PK.pad, 12, PK.pad, 120),
        children: [
          Row(children: [
            const CircleAvatar(radius: 23, backgroundColor: PK.gold, child: Text('KA', style: TextStyle(fontFamily: PK.fontDisplay, fontWeight: FontWeight.w700, color: Color(0xFF0B121A)))),
            const SizedBox(width: 12),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Bonjour 👋', style: PK.body(context, 13, color: PK.muted(context))),
                Text('Kossi Amegah', style: PK.display(context, 19)),
              ]),
            ),
            PKRoundIcon(Icons.notifications_none_rounded, label: 'Notifications', dot: true, onTap: () {}),
          ]).reveal(0),
          const SizedBox(height: 18),
          PKTap(
            onTap: () => Navigator.of(context).push(pkRoute(const SearchScreen())),
            semantics: 'Rechercher une épreuve',
            child: Container(
              height: 54,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              decoration: BoxDecoration(color: PK.surface(context), borderRadius: BorderRadius.circular(999), border: Border.all(color: PK.line(context))),
              child: Row(children: [
                Icon(Icons.search_rounded, color: PK.muted(context)),
                const SizedBox(width: 10),
                Expanded(child: Text('BEPC maths 2024, BAC D SVT…', style: PK.body(context, 15, color: PK.muted(context)))),
                Container(width: 38, height: 38, decoration: const BoxDecoration(color: PK.emerald, shape: BoxShape.circle), child: const Icon(Icons.tune_rounded, color: Colors.white, size: 18)),
              ]),
            ),
          ).reveal(1),
          const SizedBox(height: 18),
          // Carte héros : chiffre central énorme (signature DepMCu7Ml-j).
          Container(
            padding: const EdgeInsets.all(22),
            decoration: BoxDecoration(color: hero, borderRadius: BorderRadius.circular(28)),
            child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
              Row(children: [
                Text('Épreuves disponibles', style: PK.body(context, 13, color: Colors.white70)),
                const Spacer(),
                const PKBadge('Vérifiées ✓', bg: PK.lime).badgePop(3),
              ]),
              const SizedBox(height: 8),
              Row(crossAxisAlignment: CrossAxisAlignment.end, children: [
                TweenAnimationBuilder<double>(
                  tween: Tween(begin: 0, end: 15925),
                  duration: const Duration(milliseconds: 1400),
                  curve: Curves.easeOutCubic,
                  builder: (_, v, __) => Text(fcfa(v.round()).replaceAll(' FCFA', ''), style: PK.display(context, 46, color: Colors.white)),
                ),
                const SizedBox(width: 8),
                Padding(padding: const EdgeInsets.only(bottom: 8), child: Text('sujets', style: PK.body(context, 15, color: Colors.white54))),
              ]),
              const SizedBox(height: 6),
              Row(children: [
                const Icon(Icons.trending_up_rounded, color: PK.lime, size: 18),
                const SizedBox(width: 6),
                Text('+312 cette semaine · 7 examens', style: PK.body(context, 13, color: PK.lime, w: FontWeight.w600)),
              ]),
              const SizedBox(height: 18),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                _quick(context, Icons.search_rounded, 'Chercher', () => onTab(1)),
                _quick(context, Icons.download_for_offline_rounded, 'Hors ligne', () => Navigator.of(context).push(pkRoute(const OfflineScreen()))),
                _quick(context, Icons.auto_awesome_rounded, 'Tuteur IA', () => onTab(2)),
                _quick(context, Icons.payments_rounded, 'Gagner', () => onTab(3)),
              ]),
            ]),
          ).reveal(2, card: true),
          const SizedBox(height: 16),
          // Objectif de révision (barre épaisse).
          PKCard(
            child: Row(children: [
              Container(width: 46, height: 46, decoration: BoxDecoration(color: PK.gold.withValues(alpha: 0.2), shape: BoxShape.circle), child: const Icon(Icons.flag_rounded, color: Color(0xFF8A6D00))),
              const SizedBox(width: 14),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Expanded(child: Text('Objectif BEPC 2027', style: PK.body(context, 15, w: FontWeight.w700))),
                    Text('71 %', style: PK.display(context, 16, color: PK.accent(context))),
                  ]),
                  const SizedBox(height: 4),
                  Text('17 épreuves révisées sur 24', style: PK.body(context, 12, color: PK.muted(context))),
                  const SizedBox(height: 10),
                  ClipRRect(
                    borderRadius: BorderRadius.circular(9),
                    child: TweenAnimationBuilder<double>(
                      tween: Tween(begin: 0, end: 0.71),
                      duration: const Duration(milliseconds: 900),
                      curve: Curves.easeOut,
                      builder: (_, v, __) => LinearProgressIndicator(value: v, minHeight: 10, backgroundColor: PK.surface2(context), color: PK.accent(context)),
                    ),
                  ),
                ]),
              ),
            ]),
          ).reveal(3, card: true),
          const SizedBox(height: 26),
          PKSectionTitle('Par examen', action: 'Tout voir', onAction: () => onTab(1)).reveal(4),
          const SizedBox(height: 12),
          SizedBox(
            height: 112,
            child: ListView.separated(
              scrollDirection: Axis.horizontal,
              itemCount: exams.length,
              separatorBuilder: (_, __) => const SizedBox(width: 10),
              itemBuilder: (_, i) => _ExamTile(exam: exams[i]).reveal(5 + i, card: true),
            ),
          ),
          const SizedBox(height: 22),
          PKCard(
            color: PK.emerald,
            onTap: () => Navigator.of(context).push(pkRoute(const PaywallScreen())),
            child: Row(children: [
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  const PKBadge('PRO', icon: Icons.bolt_rounded),
                  const SizedBox(height: 10),
                  Text('Corrigés, tuteur illimité,\ntéléchargements sans limite', style: PK.body(context, 15, color: Colors.white, w: FontWeight.w600)),
                  const SizedBox(height: 6),
                  Text('1 000 FCFA / mois · Flooz, T-Money', style: PK.body(context, 13, color: Colors.white70)),
                ]),
              ),
              Container(width: 48, height: 48, decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle), child: const Icon(Icons.arrow_forward_rounded, color: PK.emerald)),
            ]),
          ).reveal(8, card: true),
          const SizedBox(height: 26),
          PKSectionTitle('Populaires cette semaine', action: 'Voir', onAction: () => onTab(1)).reveal(9),
          const SizedBox(height: 12),
          for (var i = 0; i < 4; i++) Padding(padding: const EdgeInsets.only(bottom: 10), child: SubjectRow(s: subjects[i]).reveal(10 + i)),
        ],
      ),
    );
  }

  Widget _quick(BuildContext context, IconData icon, String label, VoidCallback onTap) => PKTap(
        onTap: onTap,
        semantics: label,
        child: SizedBox(
          width: 70,
          child: Column(children: [
            Container(width: 54, height: 54, decoration: const BoxDecoration(color: PK.lime, shape: BoxShape.circle), child: Icon(icon, color: const Color(0xFF0B121A))),
            const SizedBox(height: 8),
            Text(label, maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 12, color: Colors.white, w: FontWeight.w600)),
          ]),
        ),
      );
}

class _ExamTile extends StatelessWidget {
  const _ExamTile({required this.exam});
  final Exam exam;
  @override
  Widget build(BuildContext context) => PKCard(
        padding: const EdgeInsets.all(14),
        onTap: () => Navigator.of(context).push(pkRoute(SearchScreen(initialExam: exam.label))),
        child: SizedBox(
          width: 106,
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Container(width: 36, height: 36, decoration: BoxDecoration(color: exam.color.withValues(alpha: 0.2), shape: BoxShape.circle), child: Icon(exam.icon, size: 19, color: exam.color)),
            const Spacer(),
            Text(exam.label, maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 14, w: FontWeight.w700)),
            Text('${exam.count} sujets', style: PK.body(context, 12, color: PK.muted(context))),
          ]),
        ),
      );
}

class SubjectRow extends StatelessWidget {
  const SubjectRow({super.key, required this.s});
  final Subject s;
  @override
  Widget build(BuildContext context) {
    final ex = s.examInfo;
    return PKCard(
      padding: const EdgeInsets.all(12),
      onTap: () => Navigator.of(context).push(pkRoute(s.pro ? const PaywallScreen() : SubjectScreen(subject: s))),
      child: Row(children: [
        Container(width: 52, height: 60, decoration: BoxDecoration(color: ex.color.withValues(alpha: 0.18), borderRadius: BorderRadius.circular(14)), child: Icon(Icons.description_rounded, color: ex.color)),
        const SizedBox(width: 12),
        Expanded(
          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
            Text('${s.matiere} · ${s.year}', maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 15, w: FontWeight.w700)),
            const SizedBox(height: 2),
            Text('${s.exam}${s.serie.isEmpty ? '' : ' · ${s.serie}'} · ${s.duree}', maxLines: 1, overflow: TextOverflow.ellipsis, style: PK.body(context, 12, color: PK.muted(context))),
            const SizedBox(height: 6),
            Row(children: [
              Icon(Icons.verified_rounded, size: 14, color: PK.accent(context)),
              const SizedBox(width: 4),
              Text('Vérifié', style: PK.body(context, 11, color: PK.accent(context), w: FontWeight.w600)),
              if (s.offline) ...[
                const SizedBox(width: 10),
                Icon(Icons.offline_pin_rounded, size: 14, color: PK.muted(context)),
                const SizedBox(width: 4),
                Text('Hors ligne', style: PK.body(context, 11, color: PK.muted(context), w: FontWeight.w600)),
              ],
            ]),
          ]),
        ),
        if (s.pro) const PKBadge('PRO', icon: Icons.lock_rounded) else Icon(Icons.chevron_right_rounded, color: PK.muted(context)),
      ]),
    );
  }
}

class PitchArchives extends StatelessWidget {
  const PitchArchives({super.key});
  @override
  Widget build(BuildContext context) => const SearchScreen(asTab: true);
}

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key, this.initialExam, this.asTab = false});
  final String? initialExam;
  final bool asTab;
  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  late String _exam = widget.initialExam ?? 'Tous';
  String _level = 'Tous niveaux';
  String _q = '';
  static const _levels = ['Tous niveaux', 'Primaire', 'Collège', 'Lycée', 'Supérieur'];

  List<Subject> get _results => subjects.where((s) {
        final okExam = _exam == 'Tous' || s.examLabel == _exam;
        final lvl = s.examInfo.level;
        final okLevel = _level == 'Tous niveaux' || lvl == _level || (_level == 'Supérieur' && (s.examLabel == 'Université' || s.examLabel == 'Concours'));
        final okQ = _q.isEmpty || s.title.toLowerCase().contains(_q.toLowerCase());
        return okExam && okLevel && okQ;
      }).toList();

  @override
  Widget build(BuildContext context) {
    final res = _results;
    final body = SafeArea(
      bottom: false,
      child: CustomScrollView(slivers: [
        SliverToBoxAdapter(
          child: widget.asTab
              ? Padding(padding: const EdgeInsets.fromLTRB(PK.pad, 16, PK.pad, 4), child: Text('Archives', style: PK.display(context, 30)).reveal(0))
              : const PKTopBar(title: 'Rechercher'),
        ),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(PK.pad, 10, PK.pad, 0),
            child: TextField(
              onChanged: (v) => setState(() => _q = v),
              style: PK.body(context, 15),
              decoration: InputDecoration(
                hintText: 'Matière, année, série…',
                hintStyle: PK.body(context, 15, color: PK.muted(context)),
                prefixIcon: Icon(Icons.search_rounded, color: PK.muted(context)),
                filled: true,
                fillColor: PK.surface(context),
                contentPadding: const EdgeInsets.symmetric(vertical: 16),
                border: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.line(context))),
                enabledBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.line(context))),
                focusedBorder: OutlineInputBorder(borderRadius: BorderRadius.circular(999), borderSide: BorderSide(color: PK.accent(context), width: 1.5)),
              ),
            ).reveal(1),
          ),
        ),
        SliverToBoxAdapter(child: _row(context, ['Tous', ...exams.map((e) => e.label)], _exam, (v) => setState(() => _exam = v)).reveal(2)),
        SliverToBoxAdapter(child: _row(context, _levels, _level, (v) => setState(() => _level = v), small: true).reveal(3)),
        SliverToBoxAdapter(
          child: Padding(
            padding: const EdgeInsets.fromLTRB(PK.pad, 18, PK.pad, 10),
            child: Text('${res.length} épreuve${res.length > 1 ? 's' : ''} trouvée${res.length > 1 ? 's' : ''}', style: PK.body(context, 13, color: PK.muted(context), w: FontWeight.w600)),
          ),
        ),
        if (res.isEmpty)
          SliverToBoxAdapter(
            child: Padding(
              padding: const EdgeInsets.all(40),
              child: Column(children: [
                Icon(Icons.inbox_rounded, size: 48, color: PK.muted(context)),
                const SizedBox(height: 10),
                Text('Aucune épreuve pour ces filtres.\nPartage la tienne et sois payé !', textAlign: TextAlign.center, style: PK.body(context, 14, color: PK.muted(context))),
              ]),
            ),
          ),
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(PK.pad, 0, PK.pad, 120),
          sliver: SliverList.separated(
            itemCount: res.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (_, i) => SubjectRow(key: ValueKey(res[i].id + _exam + _level), s: res[i]).reveal(i),
          ),
        ),
      ]),
    );
    return widget.asTab ? body : Scaffold(body: PKBackground(child: body));
  }

  Widget _row(BuildContext context, List<String> items, String sel, ValueChanged<String> on, {bool small = false}) => SizedBox(
        height: small ? 46 : 54,
        child: ListView.separated(
          padding: const EdgeInsets.fromLTRB(PK.pad, 10, PK.pad, 0),
          scrollDirection: Axis.horizontal,
          itemCount: items.length,
          separatorBuilder: (_, __) => const SizedBox(width: 8),
          itemBuilder: (_, i) => PKChip(items[i], selected: items[i] == sel, onTap: () => on(items[i])),
        ),
      );
}

class PitchProfile extends ConsumerWidget {
  const PitchProfile({super.key});
  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final dark = PK.dark(context);
    Widget item(IconData i, String t, String sub, VoidCallback onTap, int k) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: PKCard(
            padding: const EdgeInsets.all(14),
            onTap: onTap,
            child: Row(children: [
              Container(width: 42, height: 42, decoration: BoxDecoration(color: PK.surface2(context), shape: BoxShape.circle), child: Icon(i, size: 20, color: PK.ink(context))),
              const SizedBox(width: 12),
              Expanded(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Text(t, style: PK.body(context, 15, w: FontWeight.w600)),
                  Text(sub, style: PK.body(context, 12, color: PK.muted(context))),
                ]),
              ),
              Icon(Icons.chevron_right_rounded, color: PK.muted(context)),
            ]),
          ).reveal(k),
        );
    return SafeArea(
      bottom: false,
      child: ListView(padding: const EdgeInsets.fromLTRB(PK.pad, 16, PK.pad, 120), children: [
        Text('Profil', style: PK.display(context, 30)).reveal(0),
        const SizedBox(height: 16),
        PKCard(
          child: Row(children: [
            const CircleAvatar(radius: 30, backgroundColor: PK.gold, child: Text('KA', style: TextStyle(fontFamily: PK.fontDisplay, fontSize: 20, fontWeight: FontWeight.w700, color: Color(0xFF0B121A)))),
            const SizedBox(width: 14),
            Expanded(
              child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Text('Kossi Amegah', style: PK.display(context, 20)),
                Text('3e · CEG Bè-Kpota, Lomé', style: PK.body(context, 13, color: PK.muted(context))),
                const SizedBox(height: 6),
                const PKBadge('Compte gratuit', bg: Color(0x2202A671), fg: PK.mint),
              ]),
            ),
          ]),
        ).reveal(1, card: true),
        const SizedBox(height: 16),
        item(Icons.bolt_rounded, 'Passer Pro', '1 000 FCFA / mois', () => Navigator.of(context).push(pkRoute(const PaywallScreen())), 2),
        item(Icons.account_balance_wallet_rounded, 'Mes gains', 'Retirer sur Mobile Money', () => Navigator.of(context).push(pkRoute(const PayoutScreen())), 3),
        item(Icons.download_done_rounded, 'Hors ligne', 'Épreuves téléchargées', () => Navigator.of(context).push(pkRoute(const OfflineScreen())), 4),
        item(dark ? Icons.light_mode_rounded : Icons.dark_mode_rounded, dark ? 'Mode clair' : 'Mode sombre', 'Apparence de l\'application', () => ref.read(themeModeProvider.notifier).toggle(), 5),
        item(Icons.replay_rounded, 'Revoir la présentation', 'Écrans d\'accueil', () => Navigator.of(context).pushAndRemoveUntil(pkRoute(const PitchOnboarding()), (_) => false), 6),
        const SizedBox(height: 10),
        Center(child: Text('EZOA-TO · Archive. Révise. Excelle.', style: PK.body(context, 12, color: PK.muted(context)))).animate().fadeIn(delay: 600.ms),
      ]),
    );
  }
}
