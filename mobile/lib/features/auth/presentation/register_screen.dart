import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/config/env.dart';
import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../core/utils/external_links.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_searchable_picker.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../epreuves/presentation/home_screen.dart' show metaProvider;
import '../data/auth_repository.dart';

/// Profils d'inscription (valeurs API `profil_type`).
enum RegisterProfil {
  eleve('eleve', 'Élève', 'Collège ou lycée'),
  etudiant('etudiant', 'Étudiant', 'Université'),
  concours('concours', 'Concours', 'Préparation concours'),
  enseignant('enseignant', 'Enseignant', 'Professeur / formateur'),
  parent('parent', 'Parent', 'Accompagner un élève'),
  autre('autre', 'Autre', 'Usage libre');

  const RegisterProfil(this.apiValue, this.label, this.hint);
  final String apiValue;
  final String label;
  final String hint;

  bool get needsParcours =>
      this == RegisterProfil.eleve ||
      this == RegisterProfil.etudiant ||
      this == RegisterProfil.concours;
}

class RegisterScreen extends ConsumerStatefulWidget {
  const RegisterScreen({super.key});

  @override
  ConsumerState<RegisterScreen> createState() => _RegisterScreenState();
}

class _RegisterScreenState extends ConsumerState<RegisterScreen> {
  final _nom = TextEditingController();
  final _email = TextEditingController();
  final _telephone = TextEditingController();
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  final _etablissement = TextEditingController();

  /// Index dans [_visibleSteps] (pas l'index logique fixe).
  int _stepIndex = 0;
  RegisterProfil? _profil;
  String _niveau = 'college';
  String? _classe;
  bool _acceptCgu = false;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _error;
  String? _confirmError;

  List<_RegStep> get _visibleSteps {
    final steps = <_RegStep>[_RegStep.compte, _RegStep.profil];
    if (_profil?.needsParcours ?? false) steps.add(_RegStep.parcours);
    steps.add(_RegStep.pret);
    return steps;
  }

  _RegStep get _currentStep => _visibleSteps[_stepIndex.clamp(0, _visibleSteps.length - 1)];

  @override
  void dispose() {
    _nom.dispose();
    _email.dispose();
    _telephone.dispose();
    _password.dispose();
    _confirmPassword.dispose();
    _etablissement.dispose();
    super.dispose();
  }

  void _setProfil(RegisterProfil p) {
    setState(() {
      _profil = p;
      _error = null;
      if (!p.needsParcours) {
        _classe = null;
        _etablissement.clear();
      } else if (p == RegisterProfil.eleve) {
        _niveau = 'college';
        _classe = null;
      } else if (p == RegisterProfil.etudiant) {
        _niveau = 'universite';
        _classe = null;
      } else if (p == RegisterProfil.concours) {
        _niveau = 'concours';
        _classe = null;
      }
      // Recalcule les étapes visibles si on change de profil sur une étape avancée
      final steps = <_RegStep>[_RegStep.compte, _RegStep.profil];
      if (p.needsParcours) steps.add(_RegStep.parcours);
      steps.add(_RegStep.pret);
      if (_stepIndex >= steps.length) _stepIndex = steps.length - 1;
    });
  }

  bool _validateCompte() {
    setState(() {
      _error = null;
      _confirmError = null;
    });
    if (_nom.text.trim().length < 2 ||
        _email.text.trim().isEmpty ||
        _telephone.text.trim().isEmpty ||
        _password.text.length < 8) {
      setState(() => _error = 'Nom, email, téléphone et mot de passe (8+) sont requis');
      return false;
    }
    if (_password.text != _confirmPassword.text) {
      setState(() => _confirmError = 'Les mots de passe ne correspondent pas');
      return false;
    }
    return true;
  }

  bool _validateProfil() {
    if (_profil == null) {
      setState(() => _error = 'Choisis qui tu es pour continuer');
      return false;
    }
    setState(() => _error = null);
    return true;
  }

  bool _validateParcours() {
    final p = _profil;
    if (p == null || !p.needsParcours) return true;
    if (_classe == null || _classe!.isEmpty) {
      setState(() => _error = p == RegisterProfil.concours
          ? 'Sélectionne ton concours'
          : 'Sélectionne ta classe ou filière');
      return false;
    }
    if (p != RegisterProfil.concours && _etablissement.text.trim().isEmpty) {
      setState(() => _error = 'Indique ton établissement');
      return false;
    }
    setState(() => _error = null);
    return true;
  }

  void _next() {
    final step = _currentStep;
    if (step == _RegStep.compte && !_validateCompte()) return;
    if (step == _RegStep.profil && !_validateProfil()) return;
    if (step == _RegStep.parcours && !_validateParcours()) return;
    if (_stepIndex < _visibleSteps.length - 1) {
      setState(() => _stepIndex++);
    }
  }

  void _back() {
    if (_stepIndex > 0) {
      setState(() {
        _error = null;
        _confirmError = null;
        _stepIndex--;
      });
      return;
    }
    context.pop();
  }

  Future<void> _submit() async {
    if (!_validateCompte() || !_validateProfil()) return;
    if (_profil!.needsParcours && !_validateParcours()) return;
    if (!_acceptCgu) {
      setState(() => _error = 'Accepte les conditions d’utilisation pour continuer');
      return;
    }
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final needs = _profil!.needsParcours;
      await ref.read(authProvider.notifier).register(
            nom: _nom.text.trim(),
            email: _email.text.trim(),
            telephone: _telephone.text.trim(),
            password: _password.text,
            profilType: _profil!.apiValue,
            classe: needs ? _classe : null,
            etablissement: needs ? _etablissement.text.trim() : null,
          );
      if (mounted) context.go('/home');
    } catch (e) {
      final msg = e is MobileAccessDeniedException
          ? e.message
          : e is ApiException
              ? e.message
              : e.toString().replaceFirst('ApiException: ', '');
      setState(() => _error = msg);
      if (e is MobileAccessDeniedException && mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  String get _title {
    switch (_currentStep) {
      case _RegStep.compte:
        return 'Ton compte';
      case _RegStep.profil:
        return 'Qui es-tu ?';
      case _RegStep.parcours:
        return 'Ton parcours';
      case _RegStep.pret:
        return 'Prêt';
    }
  }

  String get _subtitle {
    switch (_currentStep) {
      case _RegStep.compte:
        return 'Identifiants pour rejoindre EZOA-TO';
      case _RegStep.profil:
        return 'Pour personnaliser ton expérience';
      case _RegStep.parcours:
        return _profil == RegisterProfil.concours
            ? 'Concours et centre de préparation'
            : 'Niveau, classe et établissement';
      case _RegStep.pret:
        return 'Vérifie puis crée ton compte';
    }
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final steps = _visibleSteps;
    final isLast = _currentStep == _RegStep.pret;

    return EzoaAuthLayout(
      title: _title,
      subtitle: _subtitle,
      showBack: true,
      onBack: _back,
      children: [
        _ProgressDots(count: steps.length, index: _stepIndex),
        const SizedBox(height: 20),
        ..._buildStepBody(context, pal),
        if (_error != null && _currentStep != _RegStep.compte) ...[
          const SizedBox(height: 8),
          Text(
            _error!,
            style: TextStyle(color: Theme.of(context).colorScheme.error, fontSize: 13),
          ),
        ],
        const SizedBox(height: 20),
        if (isLast)
          EzoaButton(
            label: 'Créer mon compte',
            onPressed: _submit,
            loading: _loading,
            icon: LucideIcons.userPlus,
          )
        else
          EzoaButton(
            label: 'Suivant',
            onPressed: _next,
            icon: LucideIcons.arrowRight,
          ),
        const SizedBox(height: 8),
        EzoaButton(
          label: _stepIndex == 0 ? 'Déjà inscrit ? Se connecter' : 'Retour',
          variant: EzoaButtonVariant.ghost,
          onPressed: _back,
        ),
      ],
    );
  }

  List<Widget> _buildStepBody(BuildContext context, EzoaPalette pal) {
    switch (_currentStep) {
      case _RegStep.compte:
        return _buildCompteStep();
      case _RegStep.profil:
        return _buildProfilStep(pal);
      case _RegStep.parcours:
        return _buildParcoursStep();
      case _RegStep.pret:
        return _buildPretStep(context, pal);
    }
  }

  List<Widget> _buildCompteStep() {
    return [
      EzoaTextField(label: 'Nom complet', controller: _nom, prefixIcon: LucideIcons.user),
      EzoaTextField(
        label: 'Email',
        controller: _email,
        keyboardType: TextInputType.emailAddress,
        prefixIcon: LucideIcons.mail,
      ),
      EzoaTextField(
        label: 'Téléphone',
        controller: _telephone,
        keyboardType: TextInputType.phone,
        prefixIcon: LucideIcons.phone,
      ),
      EzoaTextField(
        label: 'Mot de passe',
        controller: _password,
        obscureText: _obscurePassword,
        errorText: _error,
        prefixIcon: LucideIcons.lock,
        suffixIcon: IconButton(
          icon: Icon(
            _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
            size: 20,
            color: EzoaColors.of(context).textFaint,
          ),
          onPressed: () => setState(() => _obscurePassword = !_obscurePassword),
          tooltip: _obscurePassword ? 'Afficher le mot de passe' : 'Masquer le mot de passe',
        ),
      ),
      EzoaTextField(
        label: 'Confirmer le mot de passe',
        controller: _confirmPassword,
        obscureText: _obscureConfirmPassword,
        errorText: _confirmError,
        prefixIcon: LucideIcons.lock,
        suffixIcon: IconButton(
          icon: Icon(
            _obscureConfirmPassword ? LucideIcons.eyeOff : LucideIcons.eye,
            size: 20,
            color: EzoaColors.of(context).textFaint,
          ),
          onPressed: () => setState(() => _obscureConfirmPassword = !_obscureConfirmPassword),
          tooltip: _obscureConfirmPassword ? 'Afficher la confirmation' : 'Masquer la confirmation',
        ),
      ),
    ];
  }

  List<Widget> _buildProfilStep(EzoaPalette pal) {
    return [
      ...RegisterProfil.values.map((p) {
        final selected = _profil == p;
        return Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: Material(
            color: Colors.transparent,
            child: InkWell(
              onTap: () => _setProfil(p),
              borderRadius: BorderRadius.circular(14),
              child: AnimatedContainer(
                duration: const Duration(milliseconds: 180),
                padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
                decoration: BoxDecoration(
                  color: selected
                      ? EzoaColors.primary.withValues(alpha: 0.12)
                      : pal.subtleFill,
                  borderRadius: BorderRadius.circular(14),
                  border: Border.all(
                    color: selected
                        ? EzoaColors.primary.withValues(alpha: 0.55)
                        : pal.border,
                  ),
                ),
                child: Row(
                  children: [
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            p.label,
                            style: TextStyle(
                              fontWeight: FontWeight.w600,
                              fontSize: 15.5,
                              color: selected ? EzoaColors.primary : pal.text,
                            ),
                          ),
                          const SizedBox(height: 2),
                          Text(
                            p.hint,
                            style: TextStyle(fontSize: 13, color: pal.textMuted),
                          ),
                        ],
                      ),
                    ),
                    Icon(
                      selected ? LucideIcons.checkCircle2 : LucideIcons.circle,
                      size: 22,
                      color: selected ? EzoaColors.primary : pal.textFaint,
                    ),
                  ],
                ),
              ),
            ),
          ),
        );
      }),
    ];
  }

  List<Widget> _buildParcoursStep() {
    final metaAsync = ref.watch(metaProvider);
    final profil = _profil ?? RegisterProfil.eleve;

    return [
      metaAsync.when(
        loading: () => const Padding(
          padding: EdgeInsets.symmetric(vertical: 8),
          child: LinearProgressIndicator(),
        ),
        error: (_, __) => Text(
          'Impossible de charger les référentiels. Réessaie.',
          style: TextStyle(color: Theme.of(context).colorScheme.error),
        ),
        data: (meta) {
          if (profil == RegisterProfil.eleve) {
            final classes =
                _niveau == 'college' ? meta.classes.college : meta.classes.lycee;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Row(
                  children: [
                    Expanded(
                      child: _NiveauChip(
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
                      child: _NiveauChip(
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
                EzoaTextField(
                  label: 'Établissement',
                  controller: _etablissement,
                  prefixIcon: LucideIcons.school,
                ),
              ],
            );
          }

          if (profil == RegisterProfil.etudiant) {
            final classes = meta.classes.universite.isNotEmpty
                ? meta.classes.universite
                : PublicMeta.kDefaultAnneesEtude;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                EzoaSearchablePicker(
                  label: 'Année / niveau',
                  value: _classe,
                  items: classes,
                  onChanged: (v) => setState(() => _classe = v),
                ),
                EzoaTextField(
                  label: 'Université / établissement',
                  controller: _etablissement,
                  prefixIcon: LucideIcons.school,
                ),
              ],
            );
          }

          // Concours
          final concours = meta.concours.isNotEmpty
              ? meta.concours
              : const ['ENAM', 'Police nationale', 'Autre concours'];
          return Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              EzoaSearchablePicker(
                label: 'Concours',
                value: _classe,
                items: concours,
                onChanged: (v) => setState(() => _classe = v),
              ),
              EzoaTextField(
                label: 'Centre / établissement (optionnel)',
                controller: _etablissement,
                prefixIcon: LucideIcons.school,
              ),
            ],
          );
        },
      ),
    ];
  }

  List<Widget> _buildPretStep(BuildContext context, EzoaPalette pal) {
    final profil = _profil;
    final lines = <(String, String)>[
      ('Nom', _nom.text.trim()),
      ('Email', _email.text.trim()),
      ('Téléphone', _telephone.text.trim()),
      if (profil != null) ('Profil', profil.label),
      if (profil?.needsParcours == true && _classe != null) ('Classe / concours', _classe!),
      if (profil?.needsParcours == true && _etablissement.text.trim().isNotEmpty)
        ('Établissement', _etablissement.text.trim()),
    ];

    return [
      Container(
        padding: const EdgeInsets.all(16),
        decoration: BoxDecoration(
          color: pal.subtleFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(color: pal.border),
        ),
        child: Column(
          children: [
            for (var i = 0; i < lines.length; i++) ...[
              if (i > 0) const SizedBox(height: 10),
              Row(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SizedBox(
                    width: 110,
                    child: Text(
                      lines[i].$1,
                      style: TextStyle(fontSize: 13, color: pal.textMuted),
                    ),
                  ),
                  Expanded(
                    child: Text(
                      lines[i].$2,
                      style: TextStyle(
                        fontSize: 14,
                        fontWeight: FontWeight.w600,
                        color: pal.text,
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
      const SizedBox(height: 16),
      Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 24,
            height: 24,
            child: Checkbox(
              value: _acceptCgu,
              onChanged: (v) => setState(() => _acceptCgu = v ?? false),
              activeColor: EzoaColors.primary,
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
            ),
          ),
          const SizedBox(width: 10),
          Expanded(
            child: Wrap(
              crossAxisAlignment: WrapCrossAlignment.center,
              children: [
                Text(
                  'J’accepte les ',
                  style: TextStyle(fontSize: 13.5, height: 1.4, color: pal.textDim),
                ),
                GestureDetector(
                  onTap: () => openExternalUrl(Env.conditionsUrl),
                  child: const Text(
                    'conditions d’utilisation',
                    style: TextStyle(
                      fontSize: 13.5,
                      height: 1.4,
                      color: EzoaColors.primary,
                      fontWeight: FontWeight.w600,
                      decoration: TextDecoration.underline,
                    ),
                  ),
                ),
                Text(
                  ' d’EZOA-TO.',
                  style: TextStyle(fontSize: 13.5, height: 1.4, color: pal.textDim),
                ),
              ],
            ),
          ),
        ],
      ),
    ];
  }
}

enum _RegStep { compte, profil, parcours, pret }

class _ProgressDots extends StatelessWidget {
  const _ProgressDots({required this.count, required this.index});

  final int count;
  final int index;

  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisAlignment: MainAxisAlignment.center,
      children: List.generate(count, (i) {
        final active = i == index;
        return AnimatedContainer(
          duration: const Duration(milliseconds: 220),
          margin: const EdgeInsets.symmetric(horizontal: 4),
          height: 8,
          width: active ? 22 : 8,
          decoration: BoxDecoration(
            color: active
                ? EzoaColors.primary
                : EzoaColors.primary.withValues(alpha: 0.18),
            borderRadius: BorderRadius.circular(99),
          ),
        );
      }),
    );
  }
}

class _NiveauChip extends StatelessWidget {
  const _NiveauChip({
    required this.label,
    required this.selected,
    required this.onTap,
  });

  final String label;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 200),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: selected
              ? EzoaColors.primary.withValues(alpha: 0.15)
              : EzoaColors.of(context).subtleFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: selected ? EzoaColors.primary.withValues(alpha: 0.5) : EzoaColors.of(context).border,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: selected ? EzoaColors.primary : EzoaColors.of(context).textDim,
          ),
        ),
      ),
    );
  }
}
