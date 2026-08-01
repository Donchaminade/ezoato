import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../core/utils/external_links.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

class ForgotPasswordScreen extends ConsumerStatefulWidget {
  const ForgotPasswordScreen({super.key});

  @override
  ConsumerState<ForgotPasswordScreen> createState() =>
      _ForgotPasswordScreenState();
}

class _ForgotPasswordScreenState extends ConsumerState<ForgotPasswordScreen> {
  final _email = TextEditingController();
  bool _loading = false;
  bool _sent = false;
  String? _error;
  String? _devResetUrl;

  @override
  void dispose() {
    _email.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() {
      _error = null;
      _devResetUrl = null;
    });
    final email = _email.text.trim();
    if (email.isEmpty) {
      setState(() => _error = 'Adresse email requise');
      return;
    }
    setState(() => _loading = true);
    try {
      final res = await ref.read(apiClientProvider).requestPasswordReset(email);
      setState(() {
        _sent = true;
        _devResetUrl = res.resetUrl;
      });
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

    return EzoaAuthLayout(
      compactHeader: true,
      showBack: true,
      onBack: () => context.pop(),
      title: 'Mot de passe oublié',
      subtitle: _sent
          ? 'Vérifie ta boîte mail (et les spams).'
          : 'Saisis ton adresse email. Si un compte existe, tu recevras un lien valide 1 heure.',
      children: [
        if (_sent) ...[
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
                    'Si un compte EZOA-TO est associé à cet email, un lien de réinitialisation vient d\'être envoyé.',
                    style: EzoaTypography.bodySmall(context),
                  ),
                ),
              ],
            ),
          ),
          if (_devResetUrl != null) ...[
            const SizedBox(height: 12),
            EzoaGlassCard(
              margin: EdgeInsets.zero,
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Text(
                    'Mode développement',
                    style: EzoaTypography.bodySmall(context).copyWith(
                      fontWeight: FontWeight.w600,
                    ),
                  ),
                  const SizedBox(height: 8),
                  GestureDetector(
                    onTap: () {
                      final uri = Uri.parse(_devResetUrl!);
                      final token = uri.queryParameters['token'];
                      if (token != null && token.length >= 32) {
                        context.push('/reset-password?token=$token');
                      } else {
                        openExternalUrl(_devResetUrl!);
                      }
                    },
                    child: Text(
                      _devResetUrl!,
                      style: EzoaTypography.bodySmall(context).copyWith(
                        color: accent,
                        decoration: TextDecoration.underline,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ],
          const SizedBox(height: 16),
          EzoaButton(
            label: 'Retour à la connexion',
            onPressed: () => context.go('/login'),
            variant: EzoaButtonVariant.secondary,
            icon: LucideIcons.arrowLeft,
          ),
        ] else ...[
          EzoaTextField(
            label: 'Adresse email du compte',
            controller: _email,
            keyboardType: TextInputType.emailAddress,
            prefixIcon: LucideIcons.mail,
            errorText: _error,
          ),
          EzoaButton(
            label: 'Envoyer le lien de réinitialisation',
            onPressed: _submit,
            loading: _loading,
            icon: LucideIcons.keyRound,
          ),
        ],
        const SizedBox(height: 16),
        GestureDetector(
          onTap: _openSupport,
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
        ),
        if (!_sent) ...[
          const SizedBox(height: 8),
          Text(
            'En cas de problème ou si tu n\'as pas reçu le lien, contacte notre équipe.',
            textAlign: TextAlign.center,
            style: EzoaTypography.bodySmall(context).copyWith(
              color: EzoaColors.of(context).textMuted,
            ),
          ),
        ],
      ],
    );
  }
}
