import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/ezoa_theme.dart';

/// Champ de formulaire « liste déroulante » avec recherche.
///
/// Visuellement identique aux autres champs (InputDecoration du thème),
/// mais au tap il ouvre un bottom sheet modal glass contenant :
/// - un champ de recherche qui filtre les options en temps réel
///   (insensible à la casse et aux accents),
/// - une liste scrollable, option sélectionnée en évidence (vert EZOA + check),
/// - hauteur max ~70 % de l'écran, poignée de drag, remonte avec le clavier.
class EzoaSearchablePicker extends StatelessWidget {
  const EzoaSearchablePicker({
    super.key,
    required this.label,
    required this.value,
    required this.items,
    required this.onChanged,
    this.allowEmpty = false,
    this.emptyLabel = 'Aucune sélection',
    this.searchHint = 'Rechercher…',
  });

  final String label;
  final String? value;
  final List<String> items;
  final ValueChanged<String?> onChanged;

  /// Autorise « aucune valeur » (champ optionnel) : ajoute une option
  /// pour effacer la sélection en tête de liste.
  final bool allowEmpty;
  final String emptyLabel;
  final String searchHint;

  Future<void> _open(BuildContext context) async {
    final result = await showModalBottomSheet<_PickResult>(
      context: context,
      isScrollControlled: true,
      useSafeArea: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _PickerSheet(
        title: label,
        items: items,
        selected: value,
        allowEmpty: allowEmpty,
        emptyLabel: emptyLabel,
        searchHint: searchHint,
      ),
    );
    // null = sheet fermé sans choix ; _PickResult(null) = sélection effacée.
    if (result != null) onChanged(result.value);
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: InkWell(
        onTap: () => _open(context),
        borderRadius: BorderRadius.circular(14),
        child: InputDecorator(
          isEmpty: value == null,
          decoration: InputDecoration(
            labelText: label,
            suffixIcon: Icon(
              LucideIcons.chevronDown,
              size: 18,
              color: pal.textFaint,
            ),
          ),
          child: Text(
            value ?? '',
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              color: pal.text,
              fontWeight: FontWeight.w300,
              fontSize: 14,
            ),
          ),
        ),
      ),
    );
  }
}

/// Distingue « fermé sans choisir » (null) de « valeur choisie/effacée ».
class _PickResult {
  const _PickResult(this.value);
  final String? value;
}

class _PickerSheet extends StatefulWidget {
  const _PickerSheet({
    required this.title,
    required this.items,
    required this.selected,
    required this.allowEmpty,
    required this.emptyLabel,
    required this.searchHint,
  });

  final String title;
  final List<String> items;
  final String? selected;
  final bool allowEmpty;
  final String emptyLabel;
  final String searchHint;

  @override
  State<_PickerSheet> createState() => _PickerSheetState();
}

class _PickerSheetState extends State<_PickerSheet> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  /// Minuscules + suppression des accents pour un filtrage tolérant.
  static String _fold(String input) {
    const accents = 'àâäáãåçèéêëìíîïñòóôöõùúûüýÿœæ';
    const plain = 'aaaaaaceeeeiiiinooooouuuuyyoa';
    final lower = input.toLowerCase();
    final buffer = StringBuffer();
    for (final rune in lower.runes) {
      final char = String.fromCharCode(rune);
      final idx = accents.indexOf(char);
      buffer.write(idx >= 0 ? plain[idx] : char);
    }
    return buffer.toString();
  }

  List<String> get _filtered {
    if (_query.trim().isEmpty) return widget.items;
    final needle = _fold(_query.trim());
    return widget.items.where((e) => _fold(e).contains(needle)).toList();
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final media = MediaQuery.of(context);
    final filtered = _filtered;
    final showEmptyOption = widget.allowEmpty && _query.trim().isEmpty;

    return Padding(
      // Le sheet remonte avec le clavier.
      padding: EdgeInsets.only(bottom: media.viewInsets.bottom),
      child: Container(
        constraints: BoxConstraints(maxHeight: media.size.height * 0.7),
        decoration: BoxDecoration(
          color: pal.surfaceSolid,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
          border: Border.all(color: pal.borderStrong),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            const SizedBox(height: 10),
            Center(
              child: Container(
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: pal.textFaint.withValues(alpha: 0.4),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(20, 14, 20, 10),
              child: Text(
                widget.title,
                style: EzoaTypography.titleSmall(context),
              ),
            ),
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: TextField(
                controller: _searchController,
                autofocus: false,
                onChanged: (v) => setState(() => _query = v),
                style: GoogleFonts.inter(
                  color: pal.text,
                  fontWeight: FontWeight.w300,
                ),
                decoration: InputDecoration(
                  hintText: widget.searchHint,
                  prefixIcon: Icon(
                    LucideIcons.search,
                    size: 18,
                    color: pal.textFaint,
                  ),
                  suffixIcon: _query.isEmpty
                      ? null
                      : IconButton(
                          icon: Icon(
                            LucideIcons.x,
                            size: 16,
                            color: pal.textFaint,
                          ),
                          onPressed: () {
                            _searchController.clear();
                            setState(() => _query = '');
                          },
                        ),
                ),
              ),
            ),
            const SizedBox(height: 8),
            Flexible(
              child: filtered.isEmpty && !showEmptyOption
                  ? Padding(
                      padding: const EdgeInsets.all(28),
                      child: Text(
                        'Aucun résultat pour « ${_query.trim()} »',
                        textAlign: TextAlign.center,
                        style: EzoaTypography.bodySmall(context),
                      ),
                    )
                  : ListView.builder(
                      shrinkWrap: true,
                      padding: const EdgeInsets.fromLTRB(8, 0, 8, 16),
                      itemCount: filtered.length + (showEmptyOption ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (showEmptyOption && index == 0) {
                          return _OptionTile(
                            label: widget.emptyLabel,
                            muted: true,
                            selected: widget.selected == null,
                            onTap: () => Navigator.of(context)
                                .pop(const _PickResult(null)),
                          );
                        }
                        final item =
                            filtered[index - (showEmptyOption ? 1 : 0)];
                        return _OptionTile(
                          label: item,
                          selected: item == widget.selected,
                          onTap: () =>
                              Navigator.of(context).pop(_PickResult(item)),
                        );
                      },
                    ),
            ),
          ],
        ),
      ),
    );
  }
}

class _OptionTile extends StatelessWidget {
  const _OptionTile({
    required this.label,
    required this.selected,
    required this.onTap,
    this.muted = false,
  });

  final String label;
  final bool selected;
  final bool muted;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
        padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 13),
        decoration: BoxDecoration(
          color: selected
              ? EzoaColors.primary.withValues(alpha: pal.isDark ? 0.22 : 0.12)
              : Colors.transparent,
          borderRadius: BorderRadius.circular(12),
        ),
        child: Row(
          children: [
            Expanded(
              child: Text(
                label,
                maxLines: 1,
                overflow: TextOverflow.ellipsis,
                style: GoogleFonts.inter(
                  fontSize: 14,
                  fontWeight: selected ? FontWeight.w500 : FontWeight.w300,
                  fontStyle: muted ? FontStyle.italic : FontStyle.normal,
                  color: selected
                      ? pal.emerald
                      : (muted ? pal.textFaint : pal.text),
                ),
              ),
            ),
            if (selected)
              Icon(LucideIcons.check, size: 18, color: pal.emerald),
          ],
        ),
      ),
    );
  }
}
