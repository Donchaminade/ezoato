import '../../legal/legal_screens.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/models/models.dart';
import '../../../shared/widgets/ezoa_searchable_picker.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../../shared/widgets/bird_mascot.dart';
import '../../epreuves/presentation/home_screen.dart' show metaProvider;
import '../data/auth_repository.dart';
import 'register_widgets.dart';

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

  static const stepLabels = [
    'Infos personnelles',
    'Profil scolaire',
    'Sécurité',
  ];

  int _stepIndex = 0;
  int _dir = 1;
  RegisterProfil? _profil = RegisterProfil.eleve;
  String _niveau = 'college';
  String? _classe;
  String? _ville;
  bool _acceptCgu = false;
  SubmitStatus _status = SubmitStatus.idle;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _error;
  final Map<String, String> _fieldErrors = {};

  @override
  void initState() {
    super.initState();
    _password.addListener(() {
      if (mounted) setState(() {});
    });
  }

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
      _classe = null;
      if (!p.needsParcours) _etablissement.clear();
      _niveau = switch (p) {
        RegisterProfil.etudiant => 'universite',
        RegisterProfil.concours => 'concours',
        _ => 'college',
      };
    });
  }

  /// Validation par étape ; renvoie les erreurs par champ.
  Map<String, String> _validate(int step) {
    final e = <String, String>{};
    if (step == 0) {
      if (_nom.text.trim().length < 2) e['nom'] = 'Indique ton nom complet';
      if (!RegExp(r'^\S+@\S+\.\S+$').hasMatch(_email.text.trim())) {
        e['email'] = 'Adresse e-mail invalide';
      }
      if (_telephone.text.replaceAll(RegExp(r'\D'), '').length < 8) {
        e['telephone'] = 'Numéro invalide (8 chiffres minimum)';
      }
    } else if (step == 1) {
      final p = _profil;
      if (p == null) {
        e['profil'] = 'Choisis qui tu es';
      } else if (p.needsParcours) {
        if (_classe == null || _classe!.isEmpty) {
          e['classe'] = p == RegisterProfil.concours
              ? 'Sélectionne ton concours'
              : 'Sélectionne ta classe ou filière';
        }
        if (p != RegisterProfil.concours &&
            _etablissement.text.trim().isEmpty) {
          e['etablissement'] = 'Indique ton établissement';
        }
      }
    } else {
      if (_password.text.length < 8) e['password'] = '8 caractères minimum';
      if (_password.text != _confirmPassword.text) {
        e['confirm'] = 'Les mots de passe ne correspondent pas';
      }
      if (!_acceptCgu) e['cgu'] = 'Accepte les conditions pour continuer';
    }
    return e;
  }

  void _fail(Map<String, String> e) {
    setState(() {
      _fieldErrors
        ..clear()
        ..addAll(e);
      _error = e.values.first;
      _status = SubmitStatus.error;
    });
    _mascot.flash(MascotMood.error);
    Future<void>.delayed(const Duration(milliseconds: 900), () {
      if (mounted && _status == SubmitStatus.error) {
        setState(() => _status = SubmitStatus.idle);
      }
    });
  }

  void _goTo(int i) => setState(() {
    _dir = i > _stepIndex ? 1 : -1;
    _stepIndex = i;
  });

  void _next() {
    final e = _validate(_stepIndex);
    if (e.isNotEmpty) return _fail(e);
    setState(() {
      _fieldErrors.clear();
      _error = null;
    });
    _goTo(_stepIndex + 1);
  }

  void _back() {
    if (_stepIndex > 0) {
      setState(() {
        _error = null;
        _fieldErrors.clear();
      });
      _goTo(_stepIndex - 1);
      return;
    }
    context.pop();
  }

  final _mascot = MascotController();

  /// Branche la mascotte sur un champ : suit la saisie, ou se cache les yeux (mot de passe).
  Widget _watch(
    Widget field, {
    TextEditingController? ctrl,
    bool Function()? obscured,
  }) => Focus(
    canRequestFocus: false,
    skipTraversal: true,
    onFocusChange: (f) {
      if (!f) return _mascot.set(MascotMood.idle);
      if (obscured != null) {
        _mascot.set(obscured() ? MascotMood.hide : MascotMood.peek);
      } else {
        _mascot.typing(ctrl?.text ?? '');
      }
    },
    child: field,
  );

  /// Associe un message d'erreur serveur à l'étape concernée.
  (int, String) _stepForServerError(String msg) {
    final m = msg.toLowerCase();
    if (m.contains('email')) return (0, 'email');
    if (m.contains('téléphone') || m.contains('telephone')) {
      return (0, 'telephone');
    }
    if (m.contains('nom')) return (0, 'nom');
    if (m.contains('classe') ||
        m.contains('profil') ||
        m.contains('concours')) {
      return (1, 'classe');
    }
    if (m.contains('établissement') || m.contains('etablissement')) {
      return (1, 'etablissement');
    }
    return (2, 'password');
  }

  Future<void> _submit() async {
    for (final s in [0, 1, 2]) {
      final e = _validate(s);
      if (e.isNotEmpty) {
        if (s != _stepIndex) _goTo(s);
        return _fail(e);
      }
    }
    setState(() {
      _status = SubmitStatus.loading;
      _error = null;
      _fieldErrors.clear();
    });
    try {
      final needs = _profil!.needsParcours;
      await ref
          .read(authProvider.notifier)
          .register(
            nom: _nom.text.trim(),
            email: _email.text.trim(),
            telephone: _telephone.text.trim(),
            password: _password.text,
            profilType: _profil!.apiValue,
            classe: needs ? _classe : null,
            etablissement: _etablissement.text.trim().isEmpty
                ? null
                : _etablissement.text.trim(),
          );
      if (_ville != null) {
        ref.read(apiClientProvider).updateProfile({
          'nom': _nom.text.trim(),
          'email': _email.text.trim(),
          'telephone': _telephone.text.trim(),
          'ville': _ville,
        }).ignore();
      }
      setState(() => _status = SubmitStatus.success);
      _mascot.flash(MascotMood.happy);
      await Future<void>.delayed(const Duration(milliseconds: 900));
      if (mounted) context.go('/home');
    } catch (e) {
      final msg = e is MobileAccessDeniedException
          ? e.message
          : e is ApiException
          ? e.message
          : e.toString().replaceFirst('ApiException: ', '');
      final (step, field) = _stepForServerError(msg);
      if (step != _stepIndex) _goTo(step);
      _fail({field: msg});
      if (e is MobileAccessDeniedException && mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text(msg)));
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final isLast = _stepIndex == 2;
    final reduce = MediaQuery.of(context).disableAnimations;

    return EzoaAuthLayout(
      title: 'Créer un compte',
      subtitle: 'Gratuit, en 3 étapes',
      showBack: true,
      onBack: _back,
      children: [
        Center(
          child: BirdMascot(
            key: const Key('auth-mascot'),
            controller: _mascot,
            size: 88,
          ),
        ),
        const SizedBox(height: 8),
        RegisterStepper(labels: stepLabels, index: _stepIndex),
        const SizedBox(height: 20),
        ClipRect(
          child: AnimatedSwitcher(
            duration: Duration(milliseconds: reduce ? 0 : 300),
            switchInCurve: Curves.easeOutCubic,
            switchOutCurve: Curves.easeInCubic,
            transitionBuilder: (child, anim) {
              final incoming = child.key == ValueKey(_stepIndex);
              final dx = (incoming ? 0.25 : -0.25) * _dir;
              return FadeTransition(
                opacity: anim,
                child: SlideTransition(
                  position: Tween<Offset>(
                    begin: Offset(dx, 0),
                    end: Offset.zero,
                  ).animate(anim),
                  child: child,
                ),
              );
            },
            layoutBuilder: (current, previous) => Stack(
              alignment: Alignment.topCenter,
              children: [...previous, ?current],
            ),
            child: Column(
              key: ValueKey(_stepIndex),
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: switch (_stepIndex) {
                0 => _buildInfosStep(),
                1 => [
                  ..._buildProfilStep(pal),
                  const SizedBox(height: 8),
                  ..._buildParcoursStep(),
                ],
                _ => _buildSecuriteStep(context, pal),
              },
            ),
          ),
        ),
        if (_error != null) ...[
          const SizedBox(height: 8),
          Text(
            _error!,
            key: const Key('register-error'),
            style: TextStyle(
              color: Theme.of(context).colorScheme.error,
              fontSize: 13,
            ),
          ),
        ],
        const SizedBox(height: 20),
        Row(
          children: [
            if (_stepIndex > 0) ...[
              Expanded(
                flex: 2,
                child: EzoaButton(
                  label: 'Retour',
                  variant: EzoaButtonVariant.secondary,
                  onPressed: _back,
                ),
              ),
              const SizedBox(width: 10),
            ],
            Expanded(
              flex: 3,
              child: isLast
                  ? StatusSubmitButton(
                      label: 'Créer mon compte',
                      status: _status,
                      onPressed: _submit,
                    )
                  : EzoaButton(
                      label: 'Suivant',
                      onPressed: _next,
                      icon: LucideIcons.arrowRight,
                    ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (_stepIndex == 0)
          EzoaButton(
            label: 'Déjà inscrit ? Se connecter',
            variant: EzoaButtonVariant.ghost,
            onPressed: () => context.go('/login'),
          ),
      ],
    );
  }

  List<Widget> _buildInfosStep() {
    return [
      _watch(
        EzoaTextField(
          label: 'Nom complet',
          controller: _nom,
          prefixIcon: LucideIcons.user,
          errorText: _fieldErrors['nom'],
          onChanged: _mascot.typing,
        ),
        ctrl: _nom,
      ),
      _watch(
        ctrl: _email,
        EzoaTextField(
          onChanged: _mascot.typing,
          label: 'E-mail',
          controller: _email,
          errorText: _fieldErrors['email'],
          keyboardType: TextInputType.emailAddress,
          prefixIcon: LucideIcons.mail,
        ),
      ),
      _watch(
        ctrl: _telephone,
        EzoaTextField(
          onChanged: _mascot.typing,
          label: 'Téléphone',
          controller: _telephone,
          errorText: _fieldErrors['telephone'],
          keyboardType: TextInputType.phone,
          prefixIcon: LucideIcons.phone,
        ),
      ),
    ];
  }

  List<Widget> _buildSecuriteStep(BuildContext context, EzoaPalette pal) {
    final strength = passwordStrength(_password.text);
    return [
      _watch(
        obscured: () => _obscurePassword,
        EzoaTextField(
          label: 'Mot de passe',
          controller: _password,
          obscureText: _obscurePassword,
          errorText: _fieldErrors['password'],
          prefixIcon: LucideIcons.lock,
          suffixIcon: IconButton(
            icon: Icon(
              _obscurePassword ? LucideIcons.eyeOff : LucideIcons.eye,
              size: 20,
              color: pal.textFaint,
            ),
            onPressed: () {
              setState(() => _obscurePassword = !_obscurePassword);
              _mascot.set(_obscurePassword ? MascotMood.hide : MascotMood.peek);
            },
            tooltip: _obscurePassword
                ? 'Afficher le mot de passe'
                : 'Masquer le mot de passe',
          ),
        ),
      ),
      if (_password.text.isNotEmpty) ...[
        ClipRRect(
          borderRadius: BorderRadius.circular(99),
          child: TweenAnimationBuilder<double>(
            tween: Tween(end: strength.$1),
            duration: const Duration(milliseconds: 300),
            builder: (_, v, __) => LinearProgressIndicator(
              value: v,
              minHeight: 6,
              backgroundColor: pal.subtleFill,
              color: strength.$3,
            ),
          ),
        ),
        const SizedBox(height: 4),
        Text(
          'Force : ${strength.$2}',
          style: TextStyle(fontSize: 12, color: pal.textMuted),
        ),
        const SizedBox(height: 12),
      ],
      _watch(
        obscured: () => _obscureConfirmPassword,
        EzoaTextField(
          label: 'Confirmer le mot de passe',
          controller: _confirmPassword,
          obscureText: _obscureConfirmPassword,
          errorText: _fieldErrors['confirm'],
          prefixIcon: LucideIcons.lock,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirmPassword ? LucideIcons.eyeOff : LucideIcons.eye,
              size: 20,
              color: pal.textFaint,
            ),
            onPressed: () {
              setState(
                () => _obscureConfirmPassword = !_obscureConfirmPassword,
              );
              _mascot.set(
                _obscureConfirmPassword ? MascotMood.hide : MascotMood.peek,
              );
            },
            tooltip: _obscureConfirmPassword
                ? 'Afficher la confirmation'
                : 'Masquer la confirmation',
          ),
        ),
      ),
      const SizedBox(height: 8),
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
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.4,
                    color: pal.textDim,
                  ),
                ),
                GestureDetector(
                  onTap: () => openLegal(context, 'cgu'),
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
                  ' et la ',
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.4,
                    color: pal.textDim,
                  ),
                ),
                GestureDetector(
                  onTap: () => openLegal(context, 'confidentialite'),
                  child: const Text(
                    'politique de confidentialité',
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
                  ' d’EZOA-TO, et j’ai l’accord de mes parents si j’ai moins de 18 ans.',
                  style: TextStyle(
                    fontSize: 13.5,
                    height: 1.4,
                    color: pal.textDim,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    ];
  }

  List<Widget> _buildProfilStep(EzoaPalette pal) {
    return [
      LayoutBuilder(
        builder: (context, c) {
          final w = (c.maxWidth - 10) / 2;
          return Wrap(
            spacing: 10,
            runSpacing: 10,
            children: [
              for (final p in RegisterProfil.values)
                SizedBox(
                  width: w,
                  child: Material(
                    color: Colors.transparent,
                    child: InkWell(
                      onTap: () => _setProfil(p),
                      borderRadius: BorderRadius.circular(14),
                      child: AnimatedContainer(
                        duration: const Duration(milliseconds: 180),
                        padding: const EdgeInsets.symmetric(
                          horizontal: 12,
                          vertical: 10,
                        ),
                        decoration: BoxDecoration(
                          color: _profil == p
                              ? EzoaColors.primary.withValues(alpha: 0.12)
                              : pal.subtleFill,
                          borderRadius: BorderRadius.circular(14),
                          border: Border.all(
                            width: _profil == p ? 1.6 : 1,
                            color: _profil == p
                                ? EzoaColors.primary.withValues(alpha: 0.7)
                                : pal.border,
                          ),
                        ),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              p.label,
                              style: TextStyle(
                                fontWeight: FontWeight.w700,
                                fontSize: 14.5,
                                color: _profil == p
                                    ? EzoaColors.primary
                                    : pal.text,
                              ),
                            ),
                            Text(
                              p.hint,
                              maxLines: 1,
                              overflow: TextOverflow.ellipsis,
                              style: TextStyle(
                                fontSize: 11.5,
                                color: pal.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  ),
                ),
            ],
          );
        },
      ),
      const SizedBox(height: 14),
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
            final classes = _niveau == 'college'
                ? meta.classes.college
                : meta.classes.lycee;
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
            color: selected
                ? EzoaColors.primary.withValues(alpha: 0.5)
                : EzoaColors.of(context).border,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: TextStyle(
            fontWeight: FontWeight.w600,
            color: selected
                ? EzoaColors.primary
                : EzoaColors.of(context).textDim,
          ),
        ),
      ),
    );
  }
}
