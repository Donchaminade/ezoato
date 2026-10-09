import 'dart:async';

import 'package:file_picker/file_picker.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import 'corrections_list_screen.dart';

class CorrectionNouvelleScreen extends ConsumerStatefulWidget {
  const CorrectionNouvelleScreen({super.key, this.epreuveId});

  final String? epreuveId;

  @override
  ConsumerState<CorrectionNouvelleScreen> createState() => _CorrectionNouvelleScreenState();
}

class _CorrectionNouvelleScreenState extends ConsumerState<CorrectionNouvelleScreen> {
  final _recherche = TextEditingController();
  final _exercices = TextEditingController();
  final _blocage = TextEditingController();
  Timer? _debounce;
  List<Epreuve> _resultats = const [];
  Epreuve? _choisie;
  String? _audioPath;
  String? _audioNom;
  String? _erreur;
  bool _cherche = false;
  bool _envoi = false;
  int? _prix;
  int? _quota;

  @override
  void initState() {
    super.initState();
    final id = widget.epreuveId;
    if (id != null && id.isNotEmpty) {
      _chargerEpreuve(id);
    }
    _chargerTarif();
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _recherche.dispose();
    _exercices.dispose();
    _blocage.dispose();
    super.dispose();
  }

  Future<void> _chargerTarif() async {
    try {
      final reglages = await ref.read(apiClientProvider).getReglagesCorrectionPublics();
      if (!mounted) return;
      setState(() {
        _prix = (reglages['prixUnitaire'] as num?)?.toInt();
        _quota = (reglages['quotaPro'] as num?)?.toInt();
      });
    } catch (_) {}
  }

  Future<void> _chargerEpreuve(String id) async {
    final epreuve = await ref.read(apiClientProvider).getEpreuve(id);
    if (!mounted || epreuve == null) return;
    setState(() => _choisie = epreuve);
  }

  void _planifierRecherche(String valeur) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () => _chercher(valeur));
  }

  Future<void> _chercher(String valeur) async {
    final q = valeur.trim();
    if (q.length < 2) {
      setState(() => _resultats = const []);
      return;
    }
    setState(() => _cherche = true);
    try {
      final page = await ref.read(apiClientProvider).listEpreuves(
            ListEpreuvesParams(q: q, perPage: 8),
          );
      if (!mounted) return;
      setState(() => _resultats = page.items);
    } catch (error) {
      if (!mounted) return;
      setState(() => _erreur = '$error');
    } finally {
      if (mounted) setState(() => _cherche = false);
    }
  }

  Future<void> _choisirAudio() async {
    final fichier = await FilePicker.platform.pickFiles(
      type: FileType.custom,
      allowedExtensions: const ['m4a', 'mp3', 'aac', 'wav', 'webm', 'ogg'],
    );
    final choisi = fichier?.files.single;
    if (choisi?.path == null) return;
    setState(() {
      _audioPath = choisi!.path;
      _audioNom = choisi.name;
    });
  }

  Future<void> _envoyer() async {
    final epreuve = _choisie;
    final lignes = _exercices.text
        .split('\n')
        .map((ligne) => ligne.trim())
        .where((ligne) => ligne.isNotEmpty)
        .toList();
    if (epreuve == null) {
      setState(() => _erreur = 'Choisis une épreuve du catalogue.');
      return;
    }
    if (lignes.isEmpty) {
      setState(() => _erreur = 'Indique au moins un exercice, un par ligne.');
      return;
    }
    if (_blocage.text.trim().length < 8 && (_audioPath == null || _audioPath!.isEmpty)) {
      setState(() => _erreur = 'Explique le blocage, par écrit ou en audio.');
      return;
    }
    setState(() {
      _envoi = true;
      _erreur = null;
    });
    try {
      final creee = await ref.read(apiClientProvider).creerDemandeCorrection(
            epreuveId: epreuve.id,
            exercices: lignes,
            blocage: _blocage.text.trim(),
            audioPath: _audioPath,
          );
      ref.invalidate(mesDemandesCorrectionProvider);
      if (!mounted) return;
      context.go('/corrections/${creee['id']}');
    } catch (error) {
      if (!mounted) return;
      setState(() => _erreur = '$error');
    } finally {
      if (mounted) setState(() => _envoi = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final prix = _prix;
    final quota = _quota;
    return EzoaScreen(
      title: 'Nouvelle demande',
      subtitle: 'Épreuve, exercices, et ce qui bloque',
      child: ListView(
        padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
        children: [
          if (prix != null && quota != null)
            Text(
              'Hors quota Pro ($quota par période), une demande coûte $prix FCFA. Le Pro inclus ne dépasse pas ce quota.',
              style: EzoaTypography.bodySmall(context),
            ),
          const SizedBox(height: 16),
          TextField(
            controller: _recherche,
            decoration: const InputDecoration(
              labelText: 'Chercher une épreuve',
              hintText: 'Matière, établissement, classe…',
            ),
            onChanged: _planifierRecherche,
          ),
          if (_cherche) const LinearProgressIndicator(),
          ..._resultats.map(
            (epreuve) => ListTile(
              contentPadding: EdgeInsets.zero,
              title: Text(epreuve.titre),
              subtitle: Text('${epreuve.matiere} · ${epreuve.classe}'),
              onTap: () => setState(() {
                _choisie = epreuve;
                _resultats = const [];
                _recherche.clear();
              }),
            ),
          ),
          if (_choisie != null) ...[
            const SizedBox(height: 8),
            Text('Épreuve choisie', style: EzoaTypography.titleSmall(context)),
            Text(_choisie!.titre, style: EzoaTypography.body(context)),
          ],
          const SizedBox(height: 16),
          TextField(
            controller: _exercices,
            minLines: 4,
            maxLines: 8,
            decoration: const InputDecoration(
              labelText: 'Exercices',
              hintText: 'Un exercice par ligne',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 16),
          TextField(
            controller: _blocage,
            minLines: 3,
            maxLines: 6,
            decoration: const InputDecoration(
              labelText: 'Ce qui bloque',
              hintText: 'Explique le passage, sans demander la réponse brute',
              alignLabelWithHint: true,
            ),
          ),
          const SizedBox(height: 12),
          OutlinedButton.icon(
            onPressed: _choisirAudio,
            icon: const Icon(LucideIcons.mic, size: 18),
            label: Text(_audioNom ?? 'Joindre un audio'),
          ),
          if (_erreur != null) ...[
            const SizedBox(height: 12),
            Text(_erreur!, style: EzoaTypography.bodySmall(context).copyWith(color: EzoaColors.of(context).error)),
          ],
          const SizedBox(height: 16),
          EzoaButton(
            label: 'Envoyer la demande',
            icon: LucideIcons.send,
            loading: _envoi,
            onPressed: _envoyer,
          ),
        ],
      ),
    );
  }
}
