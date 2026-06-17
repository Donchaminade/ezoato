import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_searchable_picker.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../epreuves/presentation/home_screen.dart' show metaProvider;

class SubmitScreen extends ConsumerStatefulWidget {
  const SubmitScreen({super.key});

  @override
  ConsumerState<SubmitScreen> createState() => _SubmitScreenState();
}

class _SubmitScreenState extends ConsumerState<SubmitScreen> {
  final _titreController = TextEditingController();
  final _etablissementController = TextEditingController();
  final _picker = ImagePicker();

  String _niveau = 'college';
  String? _classe;
  String? _matiere;
  String? _ville;
  String _type = 'devoir';
  String? _periode;
  String? _examen;
  int _annee = DateTime.now().year;

  String? _pdfPath;
  List<XFile> _images = [];

  bool _submitting = false;
  String? _error;
  SoumissionResult? _result;

  @override
  void dispose() {
    _titreController.dispose();
    _etablissementController.dispose();
    super.dispose();
  }

  Future<void> _pickImages() async {
    try {
      final picked = await _picker.pickMultiImage(imageQuality: 90);
      if (picked.isEmpty) return;
      setState(() {
        _pdfPath = null;
        _images = [..._images, ...picked];
        _error = null;
      });
    } catch (e) {
      setState(() => _error = 'Sélection impossible : $e');
    }
  }

  Future<void> _takePhoto() async {
    try {
      final photo = await _picker.pickImage(source: ImageSource.camera, imageQuality: 90);
      if (photo == null) return;
      setState(() {
        _pdfPath = null;
        _images = [..._images, photo];
        _error = null;
      });
    } catch (e) {
      setState(() => _error = 'Appareil photo indisponible : $e');
    }
  }

  Future<void> _pickPdf() async {
    try {
      final res = await FilePicker.pickFiles(
        type: FileType.custom,
        allowedExtensions: ['pdf'],
      );
      final path = res?.files.single.path;
      if (path == null) return;
      setState(() {
        _images = [];
        _pdfPath = path;
        _error = null;
      });
    } catch (e) {
      setState(() => _error = 'Sélection impossible : $e');
    }
  }

  bool get _formValid =>
      _titreController.text.trim().isNotEmpty &&
      _classe != null &&
      _matiere != null &&
      _ville != null &&
      (_type != 'examen' || _examen != null) &&
      (_pdfPath != null || _images.isNotEmpty);

  Future<void> _submit() async {
    if (!_formValid || _submitting) return;
    setState(() {
      _submitting = true;
      _error = null;
    });
    try {
      final fields = <String, String>{
        'titre': _titreController.text.trim(),
        'matiere': _matiere!,
        'niveau': _niveau,
        'classe': _classe!,
        'annee': '$_annee',
        'type': _type,
        'ville': _ville!,
        if (_periode != null) 'periode': _periode!,
        if (_type == 'examen' && _examen != null) 'examen': _examen!,
        if (_etablissementController.text.trim().isNotEmpty)
          'etablissement': _etablissementController.text.trim(),
      };
      final result = await ref.read(apiClientProvider).submitSoumission(
            fields: fields,
            pdfPath: _pdfPath,
            imagePaths: _images.map((x) => x.path).toList(),
          );
      setState(() {
        _result = result;
        _titreController.clear();
        _etablissementController.clear();
        _pdfPath = null;
        _images = [];
      });
    } catch (e) {
      setState(() => _error = '$e');
    } finally {
      if (mounted) setState(() => _submitting = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isOnline = ref.watch(isOnlineProvider);
    final metaAsync = ref.watch(metaProvider);

    return EzoaScreen(
      title: 'Soumettre',
      subtitle: 'Partage tes épreuves avec la communauté',
      isOnline: isOnline,
      child: !isOnline
          ? const EmptyState(
              title: 'Hors ligne',
              message: 'Connectez-vous à Internet pour soumettre une épreuve.',
              icon: LucideIcons.cloudOff,
            )
          : metaAsync.when(
              loading: () => const Center(child: EzoaGlassLoader()),
              error: (e, _) => EmptyState(
                title: 'Erreur',
                message: '$e',
                icon: LucideIcons.alertCircle,
              ),
              data: (meta) => _buildForm(context, meta),
            ),
    );
  }

  Widget _buildForm(BuildContext context, PublicMeta meta) {
    final classes = meta.classes.forNiveau(_niveau);
    final result = _result;

    return SingleChildScrollView(
      padding: const EdgeInsets.fromLTRB(16, 14, 16, 120),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          if (result != null) ...[
            EzoaScrollReveal(
              child: EzoaGlassCard(
                margin: EdgeInsets.zero,
                enableShine: false,
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Icon(
                          LucideIcons.checkCircle2,
                          color: EzoaColors.of(context).emerald,
                          size: 22,
                        ),
                        const SizedBox(width: 10),
                        Expanded(
                          child: Text(
                            'Soumission envoyée !',
                            style: EzoaTypography.titleSmall(context),
                          ),
                        ),
                        IconButton(
                          icon: Icon(
                            LucideIcons.x,
                            size: 16,
                            color: EzoaColors.of(context).textFaint,
                          ),
                          onPressed: () => setState(() => _result = null),
                        ),
                      ],
                    ),
                    const SizedBox(height: 6),
                    Text(
                      '${result.pages} page(s) · ${result.tailleKo} Ko — votre épreuve sera examinée par un gestionnaire.',
                      style: EzoaTypography.bodySmall(context),
                    ),
                    if (result.doublonsPotentiels.isNotEmpty) ...[
                      const SizedBox(height: 6),
                      Text(
                        '${result.doublonsPotentiels.length} doublon(s) potentiel(s) détecté(s) — la modération vérifiera.',
                        style: EzoaTypography.bodySmall(context)
                            .copyWith(color: EzoaColors.of(context).gold),
                      ),
                    ],
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),
          ],
          EzoaScrollReveal(
            child: EzoaGlassCard(
              margin: EdgeInsets.zero,
              enableShine: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Métadonnées', style: EzoaTypography.titleSmall(context)),
                  const SizedBox(height: 16),
                  EzoaTextField(
                    label: 'Titre de l\'épreuve',
                    controller: _titreController,
                    prefixIcon: LucideIcons.type,
                    onChanged: (_) => setState(() {}),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: _SegmentChip(
                          label: 'Collège',
                          selected: _niveau == 'college',
                          onTap: () => setState(() {
                            _niveau = 'college';
                            _classe = null;
                          }),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: _SegmentChip(
                          label: 'Lycée',
                          selected: _niveau == 'lycee',
                          onTap: () => setState(() {
                            _niveau = 'lycee';
                            _classe = null;
                          }),
                        ),
                      ),
                    ],
                  ),
                  const SizedBox(height: 14),
                  EzoaSearchablePicker(
                    label: 'Classe',
                    value: _classe,
                    items: classes,
                    onChanged: (v) => setState(() => _classe = v),
                  ),
                  EzoaSearchablePicker(
                    label: 'Matière',
                    value: _matiere,
                    items: meta.matieres,
                    onChanged: (v) => setState(() => _matiere = v),
                  ),
                  EzoaSearchablePicker(
                    label: 'Ville',
                    value: _ville,
                    items: meta.villes,
                    onChanged: (v) => setState(() => _ville = v),
                  ),
                  Row(
                    children: [
                      Expanded(
                        child: EzoaSearchablePicker(
                          label: 'Type',
                          value: _type,
                          items: meta.types,
                          onChanged: (v) => setState(() {
                            _type = v ?? 'devoir';
                            if (_type != 'examen') _examen = null;
                          }),
                        ),
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: EzoaSearchablePicker(
                          label: 'Année',
                          value: '$_annee',
                          items: [
                            for (var y = DateTime.now().year; y >= 2000; y--) '$y',
                          ],
                          onChanged: (v) =>
                              setState(() => _annee = int.tryParse(v ?? '') ?? _annee),
                        ),
                      ),
                    ],
                  ),
                  if (_type == 'examen')
                    EzoaSearchablePicker(
                      label: 'Examen national',
                      value: _examen,
                      items: meta.examens,
                      onChanged: (v) => setState(() => _examen = v),
                    ),
                  EzoaSearchablePicker(
                    label: 'Période (optionnel)',
                    value: _periode,
                    items: meta.periodes,
                    allowEmpty: true,
                    emptyLabel: 'Aucune période',
                    onChanged: (v) => setState(() => _periode = v),
                  ),
                  EzoaTextField(
                    label: 'Établissement (optionnel)',
                    controller: _etablissementController,
                    prefixIcon: LucideIcons.school,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),
          EzoaScrollReveal(
            child: EzoaGlassCard(
              margin: EdgeInsets.zero,
              enableShine: false,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text('Fichiers', style: EzoaTypography.titleSmall(context)),
                  const SizedBox(height: 6),
                  Text(
                    'Envoyez des photos (converties en PDF) ou un PDF unique — pas les deux.',
                    style: EzoaTypography.bodySmall(context),
                  ),
                  const SizedBox(height: 16),
                  Row(
                    children: [
                      Expanded(
                        child: _PickButton(
                          label: 'Photos',
                          icon: LucideIcons.image,
                          onPressed: _pickImages,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _PickButton(
                          label: 'Caméra',
                          icon: LucideIcons.camera,
                          onPressed: _takePhoto,
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: _PickButton(
                          label: 'PDF',
                          icon: LucideIcons.fileText,
                          onPressed: _pickPdf,
                        ),
                      ),
                    ],
                  ),
                  if (_images.isNotEmpty) ...[
                    const SizedBox(height: 14),
                    ..._images.asMap().entries.map(
                          (entry) => _FileRow(
                            icon: LucideIcons.image,
                            name: entry.value.name,
                            onRemove: () => setState(() {
                              _images = [..._images]..removeAt(entry.key);
                            }),
                          ),
                        ),
                  ],
                  if (_pdfPath != null) ...[
                    const SizedBox(height: 14),
                    _FileRow(
                      icon: LucideIcons.fileText,
                      name: _pdfPath!.split(RegExp(r'[\\/]')).last,
                      onRemove: () => setState(() => _pdfPath = null),
                    ),
                  ],
                ],
              ),
            ),
          ),
          const SizedBox(height: 20),
          if (_error != null) ...[
            Text(
              _error!,
              textAlign: TextAlign.center,
              style: EzoaTypography.bodySmall(context)
                  .copyWith(color: EzoaColors.of(context).error),
            ),
            const SizedBox(height: 12),
          ],
          EzoaScrollReveal(
            child: EzoaButton(
              label: 'Soumettre l\'épreuve',
              icon: LucideIcons.upload,
              loading: _submitting,
              disabled: !_formValid,
              onPressed: _submit,
            ),
          ),
        ],
      ),
    );
  }
}

/// Bouton outline compact pour la rangée Photos / Caméra / PDF.
///
/// Contrairement à [EzoaButton], le padding horizontal est réduit et le
/// contenu (icône + libellé) est enveloppé dans un [FittedBox] : sur les
/// petites largeurs (~360 px logiques, 3 boutons côte à côte), le contenu
/// se réduit légèrement au lieu de provoquer un overflow horizontal.
class _PickButton extends StatelessWidget {
  const _PickButton({
    required this.label,
    required this.icon,
    required this.onPressed,
  });

  final String label;
  final IconData icon;
  final VoidCallback onPressed;

  @override
  Widget build(BuildContext context) {
    return OutlinedButton(
      style: OutlinedButton.styleFrom(
        padding: const EdgeInsets.symmetric(horizontal: 8),
      ),
      onPressed: onPressed,
      child: FittedBox(
        fit: BoxFit.scaleDown,
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 17),
            const SizedBox(width: 6),
            Text(label, maxLines: 1),
          ],
        ),
      ),
    );
  }
}

class _SegmentChip extends StatelessWidget {
  const _SegmentChip({
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

    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(12),
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 12),
        alignment: Alignment.center,
        decoration: BoxDecoration(
          color: selected
              ? EzoaColors.primary.withValues(alpha: pal.isDark ? 0.3 : 0.15)
              : pal.subtleFill,
          borderRadius: BorderRadius.circular(12),
          border: Border.all(
            color: selected ? pal.emerald : pal.border,
          ),
        ),
        child: Text(
          label,
          style: EzoaTypography.titleSmall(context).copyWith(fontSize: 14),
        ),
      ),
    );
  }
}

class _FileRow extends StatelessWidget {
  const _FileRow({
    required this.icon,
    required this.name,
    required this.onRemove,
  });

  final IconData icon;
  final String name;
  final VoidCallback onRemove;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      decoration: BoxDecoration(
        color: pal.subtleFill,
        borderRadius: BorderRadius.circular(10),
        border: Border.all(color: pal.border),
      ),
      child: Row(
        children: [
          Icon(icon, size: 16, color: pal.accent),
          const SizedBox(width: 10),
          Expanded(
            child: Text(
              name,
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: EzoaTypography.bodySmall(context),
            ),
          ),
          IconButton(
            visualDensity: VisualDensity.compact,
            icon: Icon(LucideIcons.x, size: 14, color: pal.textFaint),
            onPressed: onRemove,
          ),
        ],
      ),
    );
  }
}
