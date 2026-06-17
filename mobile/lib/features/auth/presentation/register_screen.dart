import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../shared/widgets/ezoa_widgets.dart';
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
  bool _loading = false;
  String? _error;

  @override
  void dispose() {
    _nom.dispose();
    _email.dispose();
    _telephone.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _submit() async {
    setState(() => _error = null);
    if (_nom.text.trim().isEmpty ||
        _email.text.trim().isEmpty ||
        _telephone.text.trim().isEmpty ||
        _password.text.length < 8) {
      setState(() => _error = 'Tous les champs sont requis (mot de passe 8+)');
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(authProvider.notifier).register(
            nom: _nom.text.trim(),
            email: _email.text.trim(),
            telephone: _telephone.text.trim(),
            password: _password.text,
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
        EzoaTextField(
          label: 'Mot de passe',
          controller: _password,
          obscureText: true,
          errorText: _error,
          prefixIcon: LucideIcons.lock,
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
