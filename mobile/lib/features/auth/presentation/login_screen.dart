import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
import '../data/auth_repository.dart';

class LoginScreen extends ConsumerStatefulWidget {
  const LoginScreen({super.key});

  @override
  ConsumerState<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends ConsumerState<LoginScreen> {
  final _identifier = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;
  bool _obscurePassword = true;
  String? _error;

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _showAccessDeniedIfNeeded());
  }

  void _showAccessDeniedIfNeeded() {
    final msg = ref.read(authProvider).accessDeniedMessage;
    if (msg == null || !mounted) return;
    setState(() => _error = msg);
    ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
    ref.read(authProvider.notifier).clearAccessDeniedMessage();
  }

  @override
  void dispose() {
    _identifier.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_identifier.text.trim().isEmpty || _password.text.isEmpty) {
      setState(() => _error = 'Identifiant et mot de passe requis');
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).login(
            _identifier.text.trim(),
            _password.text,
          );
      if (mounted) context.go('/home');
    } catch (e) {
      final msg = e is MobileAccessDeniedException
          ? e.message
          : e.toString().replaceFirst('ApiException: ', '');
      setState(() => _error = msg);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    ref.listen<AuthState>(authProvider, (prev, next) {
      final msg = next.accessDeniedMessage;
      if (msg != null && msg != prev?.accessDeniedMessage) {
        setState(() => _error = msg);
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
        ref.read(authProvider.notifier).clearAccessDeniedMessage();
      }
    });

    return EzoaAuthLayout(
      compactHeader: true,
      title: 'Bienvenue sur EZOA-TO',
      subtitle: 'Connectez-vous pour accéder aux épreuves',
      children: [
        EzoaTextField(
          label: 'Email ou téléphone',
          controller: _identifier,
          keyboardType: TextInputType.emailAddress,
          prefixIcon: LucideIcons.mail,
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
        Center(
          child: GestureDetector(
            onTap: () => context.push('/forgot-password'),
            child: Text(
              'Mot de passe oublié ?',
              textAlign: TextAlign.center,
              style: EzoaTypography.bodySmall(context).copyWith(
                color: EzoaColors.of(context).accent,
                fontWeight: FontWeight.w600,
              ),
            ),
          ),
        ),
        const SizedBox(height: 8),
        EzoaButton(
          label: 'Se connecter',
          onPressed: _submit,
          loading: _loading,
          icon: LucideIcons.logIn,
        ),
        const SizedBox(height: 16),
        Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Text('Pas encore de compte ? ', style: EzoaTypography.bodySmall(context)),
            GestureDetector(
              onTap: () => context.push('/register'),
              child: Text(
                "S'inscrire",
                style: EzoaTypography.bodySmall(context).copyWith(
                  color: EzoaColors.of(context).accent,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }
}
