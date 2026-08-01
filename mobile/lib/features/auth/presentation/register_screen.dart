import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_searchable_picker.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../../epreuves/presentation/home_screen.dart' show metaProvider;
import '../data/auth_repository.dart';

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
  String _niveau = 'college';
  String? _classe;
  bool _loading = false;
  bool _obscurePassword = true;
  bool _obscureConfirmPassword = true;
  String? _error;
  String? _confirmError;

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

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _confirmError = null;
    });
    if (_nom.text.trim().isEmpty ||
        _email.text.trim().isEmpty ||
        _telephone.text.trim().isEmpty ||
        _password.text.length < 8 ||
        _classe == null ||
        _classe!.isEmpty ||
        _etablissement.text.trim().isEmpty) {
      setState(() => _error = 'Tous les champs sont requis (mot de passe 8+, classe et établissement)');
      return;
    }
    if (_password.text != _confirmPassword.text) {
      setState(() => _confirmError = 'Les mots de passe ne correspondent pas');
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            nom: _nom.text.trim(),
            email: _email.text.trim(),
            telephone: _telephone.text.trim(),
            password: _password.text,
            classe: _classe!,
            etablissement: _etablissement.text.trim(),
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

  @override
  Widget build(BuildContext context) {
    final metaAsync = ref.watch(metaProvider);

    return EzoaAuthLayout(
      title: 'Créer votre compte',
      subtitle: 'Rejoignez la communauté EZOA-TO',
      showBack: true,
      onBack: () => context.pop(),
      children: [
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
        metaAsync.when(
          loading: () => const Padding(
            padding: EdgeInsets.symmetric(vertical: 8),
            child: LinearProgressIndicator(),
          ),
          error: (_, __) => const SizedBox.shrink(),
          data: (meta) {
            final classes = _niveau == 'college' ? meta.classes.college : meta.classes.lycee;
            return Column(
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
          },
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
        const SizedBox(height: 8),
        EzoaButton(
          label: 'Créer mon compte',
          onPressed: _submit,
          loading: _loading,
          icon: LucideIcons.userPlus,
        ),
        const SizedBox(height: 12),
        EzoaButton(
          label: 'Déjà inscrit ? Se connecter',
          variant: EzoaButtonVariant.ghost,
          onPressed: () => context.pop(),
        ),
      ],
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
