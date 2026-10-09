import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/demande_correction.dart';

final demandeCorrectionProvider = FutureProvider.family<DemandeCorrection, String>((ref, id) async {
  final row = await ref.watch(apiClientProvider).getDemandeCorrection(id);
  return DemandeCorrection.fromJson(row);
});

class CorrectionDetailScreen extends ConsumerStatefulWidget {
  const CorrectionDetailScreen({super.key, required this.id});

  final String id;

  @override
  ConsumerState<CorrectionDetailScreen> createState() => _CorrectionDetailScreenState();
}

class _CorrectionDetailScreenState extends ConsumerState<CorrectionDetailScreen> {
  String? _feedback;
  String _methode = 'flooz';
  final _telephone = TextEditingController();
  Map<String, dynamic>? _paiement;
  bool _loading = false;

  @override
  void dispose() {
    _telephone.dispose();
    super.dispose();
  }

  Future<void> _initier() async {
    final tel = _telephone.text.replaceAll(RegExp(r'\D'), '');
    if (tel.length < 8) {
      setState(() => _feedback = 'Entrez un numéro valide');
      return;
    }
    setState(() => _loading = true);
    try {
      final paiement = await ref.read(apiClientProvider).initierPaiementCorrection(
            demandeId: widget.id,
            methode: _methode,
            telephone: tel,
          );
      if (!mounted) return;
      setState(() {
        _paiement = paiement;
        _feedback = null;
      });
    } catch (error) {
      if (!mounted) return;
      setState(() => _feedback = '$error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _confirmer() async {
    final reference = '${_paiement?['reference'] ?? ''}';
    if (reference.isEmpty) return;
    setState(() => _loading = true);
    try {
      await ref.read(apiClientProvider).confirmerPaiementCorrection(
            demandeId: widget.id,
            reference: reference,
          );
      if (!mounted) return;
      setState(() => _paiement = null);
      ref.invalidate(demandeCorrectionProvider(widget.id));
    } catch (error) {
      if (!mounted) return;
      setState(() => _feedback = '$error');
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _repondre(String questionId, int choix) async {
    try {
      final texte = await ref.read(apiClientProvider).repondreQcmCorrection(
            demandeId: widget.id,
            questionId: questionId,
            choice: choix,
          );
      if (!mounted) return;
      setState(() => _feedback = texte);
    } catch (error) {
      if (!mounted) return;
      setState(() => _feedback = '$error');
    }
  }

  @override
  Widget build(BuildContext context) {
    final demande = ref.watch(demandeCorrectionProvider(widget.id));
    return EzoaScreen(
      title: 'Suivi',
      subtitle: 'Ta demande de correction',
      loading: demande.isLoading,
      child: demande.when(
        loading: () => const SizedBox.shrink(),
        error: (error, _) => Padding(
          padding: const EdgeInsets.all(24),
          child: Text('$error', style: EzoaTypography.body(context)),
        ),
        data: (item) => ListView(
          padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
          children: [
            Text(item.epreuveTitre, style: EzoaTypography.titleSmall(context)),
            const SizedBox(height: 4),
            Text(
              '${item.matiere} · ${statutDemandeLabel[item.statut] ?? item.statut}',
              style: EzoaTypography.bodySmall(context),
            ),
            if (item.exercices.isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Exercices : ${item.exercices.join(', ')}', style: EzoaTypography.body(context)),
            ],
            if (item.statut == 'en_attente_reglement') ...[
              const SizedBox(height: 16),
              Text(
                'Règlement ${item.montant ?? 1500} FCFA, Flooz ou T-Money.',
                style: EzoaTypography.body(context),
              ),
              const SizedBox(height: 8),
              if (_paiement == null) ...[
                Row(
                  children: [
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _methode = 'flooz'),
                        child: Text(_methode == 'flooz' ? 'Flooz ✓' : 'Flooz'),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: OutlinedButton(
                        onPressed: () => setState(() => _methode = 'tmoney'),
                        child: Text(_methode == 'tmoney' ? 'T-Money ✓' : 'T-Money'),
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 8),
                TextField(
                  controller: _telephone,
                  keyboardType: TextInputType.phone,
                  decoration: const InputDecoration(labelText: 'Numéro Mobile Money'),
                ),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _loading ? null : _initier,
                  child: const Text('Continuer'),
                ),
              ] else ...[
                Text('${_paiement!['instructions']?['titre'] ?? 'Paiement'}', style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 4),
                Text('${_paiement!['reference']}', style: EzoaTypography.bodySmall(context)),
                const SizedBox(height: 8),
                FilledButton(
                  onPressed: _loading ? null : _confirmer,
                  child: Text(_paiement!['simulated'] == true ? 'Confirmer (simulation)' : 'J\'ai payé — vérifier'),
                ),
              ],
            ],
            if ((item.blocageTexte ?? '').isNotEmpty) ...[
              const SizedBox(height: 16),
              Text('Ton blocage', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 4),
              Text(item.blocageTexte!, style: EzoaTypography.body(context)),
            ],
            if ((item.transcription ?? '').isNotEmpty) ...[
              const SizedBox(height: 8),
              Text('Transcription : ${item.transcription}', style: EzoaTypography.bodySmall(context)),
            ],
            if (item.guide != null) ...[
              const SizedBox(height: 20),
              Text('Aide guidée', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 8),
              Text(item.guide!.explications, style: EzoaTypography.body(context)),
              ...item.guide!.exemples.map(
                (exemple) => Padding(
                  padding: const EdgeInsets.only(top: 6),
                  child: Text('• $exemple', style: EzoaTypography.body(context)),
                ),
              ),
              ...item.guide!.qcm.map((question) => Padding(
                    padding: const EdgeInsets.only(top: 16),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Text(question.prompt, style: EzoaTypography.titleSmall(context)),
                        const SizedBox(height: 8),
                        ...question.choices.asMap().entries.map(
                              (entry) => Padding(
                                padding: const EdgeInsets.only(bottom: 8),
                                child: OutlinedButton(
                                  onPressed: () => _repondre(question.id, entry.key),
                                  child: Text(entry.value),
                                ),
                              ),
                            ),
                      ],
                    ),
                  )),
              if (_feedback != null) ...[
                const SizedBox(height: 8),
                Text(_feedback!, style: EzoaTypography.body(context)),
              ],
            ],
            if ((item.livraison ?? '').isNotEmpty) ...[
              const SizedBox(height: 20),
              Text('Version commentée', style: EzoaTypography.titleSmall(context)),
              const SizedBox(height: 8),
              Text(item.livraison!, style: EzoaTypography.body(context)),
            ],
            const SizedBox(height: 20),
            EzoaButton(
              label: 'Retour aux demandes',
              variant: EzoaButtonVariant.outline,
              onPressed: () => context.go('/corrections'),
            ),
          ],
        ),
      ),
    );
  }
}
