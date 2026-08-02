import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/archives_filters.dart';
import 'home_screen.dart' show metaProvider;

/// Bottom sheet filtres Archives — Appliquer / Réinitialiser.
Future<ArchivesFilters?> showArchivesFilterSheet(
  BuildContext context, {
  required ArchivesFilters initial,
}) {
  return showModalBottomSheet<ArchivesFilters>(
    context: context,
    isScrollControlled: true,
    backgroundColor: Colors.transparent,
    builder: (ctx) => _ArchivesFilterSheet(initial: initial),
  );
}

class _ArchivesFilterSheet extends ConsumerStatefulWidget {
  const _ArchivesFilterSheet({required this.initial});

  final ArchivesFilters initial;

  @override
  ConsumerState<_ArchivesFilterSheet> createState() =>
      _ArchivesFilterSheetState();
}

class _ArchivesFilterSheetState extends ConsumerState<_ArchivesFilterSheet> {
  late ArchivesFilters _draft;

  @override
  void initState() {
    super.initState();
    _draft = widget.initial;
  }

  List<int> get _annees {
    final y = DateTime.now().year;
    return [for (var i = 0; i <= 12; i++) y - i];
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final metaAsync = ref.watch(metaProvider);
    final bottom = MediaQuery.paddingOf(context).bottom;

    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.sizeOf(context).height * 0.88,
      ),
      decoration: BoxDecoration(
        color: pal.dialogBg,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(22)),
        border: Border.all(color: pal.border),
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          const SizedBox(height: 10),
          Container(
            width: 40,
            height: 4,
            decoration: BoxDecoration(
              color: pal.borderStrong,
              borderRadius: BorderRadius.circular(999),
            ),
          ),
          Padding(
            padding: const EdgeInsets.fromLTRB(20, 16, 12, 8),
            child: Row(
              children: [
                Expanded(
                  child: Text(
                    'Filtres',
                    style: EzoaTypography.titleMedium(context),
                  ),
                ),
                TextButton(
                  onPressed: () => setState(() => _draft = ArchivesFilters.empty),
                  child: Text(
                    'Réinitialiser',
                    style: TextStyle(color: pal.textDim, fontSize: 13),
                  ),
                ),
              ],
            ),
          ),
          Flexible(
            child: metaAsync.when(
              loading: () => const Padding(
                padding: EdgeInsets.all(40),
                child: Center(child: EzoaGlassLoader()),
              ),
              error: (e, _) => Padding(
                padding: const EdgeInsets.all(24),
                child: Text('$e', style: TextStyle(color: pal.error)),
              ),
              data: (meta) {
                return SingleChildScrollView(
                  padding: const EdgeInsets.fromLTRB(20, 4, 20, 12),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      _Section(
                        title: 'Année',
                        child: _ChipWrap(
                          children: [
                            for (final y in _annees)
                              _FilterChip(
                                label: '$y',
                                selected: _draft.annee == y,
                                onTap: () => setState(() {
                                  _draft = _draft.annee == y
                                      ? _draft.copyWith(clearAnnee: true)
                                      : _draft.copyWith(annee: y);
                                }),
                              ),
                          ],
                        ),
                      ),
                      _Section(
                        title: 'Type',
                        child: _ChipWrap(
                          children: [
                            for (final t in meta.types)
                              _FilterChip(
                                label: epreuveTypeLabel(t),
                                selected: _draft.type == t,
                                onTap: () => setState(() {
                                  final next = _draft.type == t
                                      ? _draft.copyWith(clearType: true)
                                      : _draft.copyWith(type: t);
                                  // Examen national n'a de sens que pour type examen.
                                  if (next.type != 'examen') {
                                    _draft = next.copyWith(clearExamen: true);
                                  } else {
                                    _draft = next;
                                  }
                                }),
                              ),
                          ],
                        ),
                      ),
                      _Section(
                        title: 'Niveau',
                        child: _ChipWrap(
                          children: [
                            for (final n in meta.niveaux)
                              _FilterChip(
                                label: epreuveNiveauLabel(n),
                                selected: _draft.niveau == n,
                                onTap: () => setState(() {
                                  _draft = _draft.niveau == n
                                      ? _draft.copyWith(clearNiveau: true)
                                      : _draft.copyWith(niveau: n);
                                }),
                              ),
                          ],
                        ),
                      ),
                      _Section(
                        title: 'Période',
                        child: _ChipWrap(
                          children: [
                            for (final p in meta.periodes)
                              _FilterChip(
                                label: epreuvePeriodeLabel(p),
                                selected: _draft.periode == p,
                                onTap: () => setState(() {
                                  _draft = _draft.periode == p
                                      ? _draft.copyWith(clearPeriode: true)
                                      : _draft.copyWith(periode: p);
                                }),
                              ),
                          ],
                        ),
                      ),
                      _Section(
                        title: 'Examen national',
                        child: _ChipWrap(
                          children: [
                            for (final e in meta.examens)
                              _FilterChip(
                                label: epreuveExamenLabel(e),
                                selected: _draft.examen == e,
                                onTap: () => setState(() {
                                  if (_draft.examen == e) {
                                    _draft = _draft.copyWith(clearExamen: true);
                                  } else {
                                    _draft = _draft.copyWith(
                                      examen: e,
                                      type: 'examen',
                                    );
                                  }
                                }),
                              ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              },
            ),
          ),
          Padding(
            padding: EdgeInsets.fromLTRB(20, 8, 20, 16 + bottom),
            child: Row(
              children: [
                Expanded(
                  child: OutlinedButton(
                    onPressed: () => Navigator.pop(context, ArchivesFilters.empty),
                    child: const Text('Effacer'),
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  flex: 2,
                  child: FilledButton.icon(
                    onPressed: () => Navigator.pop(context, _draft),
                    icon: const Icon(LucideIcons.check, size: 18),
                    label: Text(
                      _draft.isEmpty
                          ? 'Afficher tout'
                          : 'Appliquer (${_draft.activeCount})',
                    ),
                    style: FilledButton.styleFrom(
                      backgroundColor: EzoaColors.primary,
                      foregroundColor: Colors.white,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _Section extends StatelessWidget {
  const _Section({required this.title, required this.child});

  final String title;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 18),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            title,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 14,
              fontWeight: FontWeight.w600,
              color: pal.text,
            ),
          ),
          const SizedBox(height: 10),
          child,
        ],
      ),
    );
  }
}

class _ChipWrap extends StatelessWidget {
  const _ChipWrap({required this.children});

  final List<Widget> children;

  @override
  Widget build(BuildContext context) {
    return Wrap(spacing: 8, runSpacing: 8, children: children);
  }
}

class _FilterChip extends StatelessWidget {
  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    return Material(
      color: Colors.transparent,
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(999),
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: selected ? EzoaColors.primary : pal.subtleFill,
            borderRadius: BorderRadius.circular(999),
            border: Border.all(
              color: selected ? EzoaColors.primaryDark : pal.border,
            ),
          ),
          child: Text(
            label,
            style: GoogleFonts.inter(
              fontSize: 12.5,
              fontWeight: FontWeight.w500,
              color: selected ? Colors.white : pal.text,
            ),
          ),
        ),
      ),
    );
  }
}
