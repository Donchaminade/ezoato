import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../core/utils/external_links.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

class ResetPasswordScreen extends ConsumerStatefulWidget {
  const ResetPasswordScreen({super.key, this.token});

  final String? token;

  @override
  ConsumerState<ResetPasswordScreen> createState() =>
      _ResetPasswordScreenState();
}

class _ResetPasswordScreenState extends ConsumerState<ResetPasswordScreen> {
  final _password = TextEditingController();
  final _confirmPassword = TextEditingController();
  bool _loading = false;
  bool _verifying = true;
  bool _done = false;
  bool _tokenValid = false;
  bool _obscurePassword = true;
  bool _obscureConfirm = true;
  String? _email;
  String? _error;
  String? _confirmError;

  @override
  void initState() {
    super.initState();
    _verifyToken();
  }

  @override
  void dispose() {
    _password.dispose();
    _confirmPassword.dispose();
    super.dispose();
  }

  Future<void> _verifyToken() async {
    final token = widget.token?.trim();
    if (token == null || token.length < 32) {
      setState(() {
        _verifying = false;
        _tokenValid = false;
      });
      return;
    }
    try {
      final res = await ref.read(apiClientProvider).verifyResetToken(token);
      setState(() {
        _tokenValid = res.valid;
        _email = res.email;
      });
    } catch (_) {
      setState(() => _tokenValid = false);
    } finally {
      if (mounted) setState(() => _verifying = false);
    }
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _confirmError = null;
    });
    final token = widget.token?.trim();
    if (token == null || token.length < 32) return;

    if (_password.text.length < 8) {
      setState(() => _error = 'Mot de passe trop court (8 caractères minimum)');
      return;
    }
    if (_password.text != _confirmPassword.text) {
      setState(() => _confirmError = 'Les mots de passe ne correspondent pas');
      return;
    }

    setState(() => _loading = true);
    try {
      final message = await ref.read(apiClientProvider).resetPassword(
            token: token,
            password: _password.text,
          );
      setState(() => _done = true);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(message)));
      }
    } catch (e) {
      final msg = e.toString().replaceFirst('ApiException: ', '');
      setState(() => _error = msg);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text(msg)));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _openSupport() async {
    final ok = await openContactPage();
    if (!ok && mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Impossible d\'ouvrir la page contact')),
      );
    }
  }

  @override
  Widget build(BuildContext context) {
    final accent = EzoaColors.of(context).accent;
    final token = widget.token?.trim();

    if (_verifying) {
      return EzoaAuthLayout(
        compactHeader: true,
        title: 'Vérification du lien',
        subtitle: 'Patientez un instant…',
        children: const [
          Center(child: EzoaGlassLoader()),
        ],
      );
    }

    if (token == null || token.length < 32 || !_tokenValid) {
      return EzoaAuthLayout(
        compactHeader: true,
        showBack: true,
        onBack: () => context.go('/login'),
        title: 'Lien invalide',
        subtitle: 'Ce lien est incomplet, expiré ou déjà utilisé.',
        children: [
          EzoaGlassCard(
            margin: EdgeInsets.zero,
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(LucideIcons.alertTriangle, color: accent, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Demande un nouveau lien ou contacte le support si le problème persiste.',
                    style: EzoaTypography.bodySmall(context),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          EzoaButton(
            label: 'Demander un nouveau lien',
            onPressed: () => context.push('/forgot-password'),
            icon: LucideIcons.keyRound,
          ),
          const SizedBox(height: 12),
          EzoaButton(
            label: 'Retour à la connexion',
            onPressed: () => context.go('/login'),
            variant: EzoaButtonVariant.secondary,
            icon: LucideIcons.arrowLeft,
          ),
          const SizedBox(height: 16),
          _SupportLink(onTap: _openSupport),
        ],
      );
    }

    if (_done) {
      return EzoaAuthLayout(
        compactHeader: true,
        title: 'Mot de passe mis à jour',
        subtitle: 'Tu peux te connecter avec ton nouveau mot de passe.',
        children: [
          EzoaGlassCard(
            margin: EdgeInsets.zero,
            padding: const EdgeInsets.all(16),
            child: Row(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Icon(LucideIcons.checkCircle2, color: accent, size: 22),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'Ton mot de passe a été modifié avec succès.',
                    style: EzoaTypography.bodySmall(context),
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(height: 16),
          EzoaButton(
            label: 'Se connecter',
            onPressed: () => context.go('/login'),
            icon: LucideIcons.logIn,
          ),
        ],
      );
    }

    return EzoaAuthLayout(
      compactHeader: true,
      showBack: true,
      onBack: () => context.pop(),
      title: 'Nouveau mot de passe',
      subtitle: _email != null
          ? 'Compte : $_email'
          : 'Choisis un mot de passe sécurisé (8 caractères minimum).',
      children: [
        EzoaTextField(
          label: 'Nouveau mot de passe',
          controller: _password,
          obscureText: _obscurePassword,
          prefixIcon: LucideIcons.lock,
          errorText: _error,
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
          obscureText: _obscureConfirm,
          prefixIcon: LucideIcons.lock,
          errorText: _confirmError,
          suffixIcon: IconButton(
            icon: Icon(
              _obscureConfirm ? LucideIcons.eyeOff : LucideIcons.eye,
              size: 20,
              color: EzoaColors.of(context).textFaint,
            ),
            onPressed: () => setState(() => _obscureConfirm = !_obscureConfirm),
            tooltip: _obscureConfirm ? 'Afficher le mot de passe' : 'Masquer le mot de passe',
          ),
        ),
        EzoaButton(
          label: 'Enregistrer le nouveau mot de passe',
          onPressed: _submit,
          loading: _loading,
          icon: LucideIcons.lock,
        ),
        const SizedBox(height: 16),
        _SupportLink(onTap: _openSupport),
      ],
    );
  }
}

class _SupportLink extends StatelessWidget {
  const _SupportLink({required this.onTap});

  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final accent = EzoaColors.of(context).accent;
    return GestureDetector(
      onTap: onTap,
      child: Row(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(LucideIcons.lifeBuoy, size: 16, color: accent),
          const SizedBox(width: 6),
          Text(
            'Contacter le support',
            style: EzoaTypography.bodySmall(context).copyWith(
              color: accent,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }
}
