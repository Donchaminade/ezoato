import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../../core/network/api_client.dart';
import '../../../core/theme/ezoa_theme.dart';
import '../../../shared/widgets/ezoa_widgets.dart';

final profileProvider = FutureProvider((ref) => ref.watch(apiClientProvider).getProfile());

class ProfileScreen extends ConsumerStatefulWidget {
  const ProfileScreen({super.key});

  @override
  ConsumerState<ProfileScreen> createState() => _ProfileScreenState();
}

class _ProfileScreenState extends ConsumerState<ProfileScreen> {
  int _tab = 0;
  final _nom = TextEditingController();
  final _email = TextEditingController();
  final _telephone = TextEditingController();
  final _ville = TextEditingController();
  final _currentPassword = TextEditingController();
  final _password = TextEditingController();
  bool _loading = false;

  @override
  void dispose() {
    _nom.dispose();
    _email.dispose();
    _telephone.dispose();
    _ville.dispose();
    _currentPassword.dispose();
    _password.dispose();
    super.dispose();
  }

  Future<void> _saveInfo() async {
    setState(() => _loading = true);
    try {
      await ref.read(apiClientProvider).updateProfile({
        'nom': _nom.text.trim(),
        'email': _email.text.trim(),
        'telephone': _telephone.text.trim(),
        'ville': _ville.text.trim().isEmpty ? null : _ville.text.trim(),
      });
      ref.invalidate(profileProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Profil mis à jour')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _savePassword() async {
    if (_currentPassword.text.isEmpty || _password.text.length < 8) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Mot de passe actuel et nouveau (8+) requis')),
      );
      return;
    }
    setState(() => _loading = true);
    try {
      await ref.read(apiClientProvider).updateProfile({
        'nom': _nom.text.trim(),
        'email': _email.text.trim(),
        'telephone': _telephone.text.trim(),
        'ville': _ville.text.trim().isEmpty ? null : _ville.text.trim(),
        'currentPassword': _currentPassword.text,
        'password': _password.text,
      });
      _currentPassword.clear();
      _password.clear();
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mot de passe modifié')),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('$e')));
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final profileAsync = ref.watch(profileProvider);

    return EzoaDetailScreen(
      title: 'Profil',
      loading: profileAsync.isLoading,
      body: profileAsync.when(
        loading: () => const SizedBox.shrink(),
        error: (e, _) => EmptyState(title: 'Erreur', message: '$e', icon: LucideIcons.alertCircle),
        data: (data) {
          if (_nom.text.isEmpty) {
            _nom.text = data.user.nom;
            _email.text = data.user.email;
            _telephone.text = data.user.telephone ?? '';
            _ville.text = data.user.ville ?? '';
          }

          return Column(
            children: [
              Padding(
                padding: const EdgeInsets.all(16),
                child: Row(
                  children: [
                    Expanded(
                      child: _TabChip(
                        label: 'Informations',
                        active: _tab == 0,
                        onTap: () => setState(() => _tab = 0),
                      ),
                    ),
                    const SizedBox(width: 8),
                    Expanded(
                      child: _TabChip(
                        label: 'Sécurité',
                        active: _tab == 1,
                        onTap: () => setState(() => _tab = 1),
                      ),
                    ),
                  ],
                ),
              ),
              Expanded(
                child: SingleChildScrollView(
                  padding: const EdgeInsets.all(16),
                  child: EzoaGlassCard(
                    margin: EdgeInsets.zero,
                    enableShine: false,
                    child: _tab == 0
                        ? Column(
                            children: [
                              EzoaTextField(label: 'Nom', controller: _nom, prefixIcon: LucideIcons.user),
                              EzoaTextField(label: 'Email', controller: _email, prefixIcon: LucideIcons.mail),
                              EzoaTextField(label: 'Téléphone', controller: _telephone, prefixIcon: LucideIcons.phone),
                              EzoaTextField(label: 'Ville', controller: _ville, prefixIcon: LucideIcons.mapPin),
                              EzoaButton(label: 'Enregistrer', onPressed: _saveInfo, loading: _loading),
                            ],
                          )
                        : Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                'Changez votre mot de passe de connexion',
                                style: EzoaTypography.body(context),
                              ),
                              const SizedBox(height: 16),
                              EzoaTextField(
                                label: 'Mot de passe actuel',
                                controller: _currentPassword,
                                obscureText: true,
                                prefixIcon: LucideIcons.lock,
                              ),
                              EzoaTextField(
                                label: 'Nouveau mot de passe',
                                controller: _password,
                                obscureText: true,
                                prefixIcon: LucideIcons.key,
                              ),
                              EzoaButton(
                                label: 'Modifier le mot de passe',
                                onPressed: _savePassword,
                                loading: _loading,
                              ),
                            ],
                          ),
                  ),
                ),
              ),
            ],
          );
        },
      ),
    );
  }
}

class _TabChip extends StatelessWidget {
  const _TabChip({required this.label, required this.active, required this.onTap});

  final String label;
  final bool active;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return GestureDetector(
      onTap: onTap,
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 250),
        padding: const EdgeInsets.symmetric(vertical: 12),
        decoration: BoxDecoration(
          color: active
              ? EzoaColors.primary.withValues(alpha: pal.isDark ? 0.25 : 0.12)
              : pal.subtleFill,
          borderRadius: BorderRadius.circular(14),
          border: Border.all(
            color: active ? EzoaColors.primary.withValues(alpha: 0.5) : pal.border,
          ),
        ),
        alignment: Alignment.center,
        child: Text(
          label,
          style: EzoaTypography.titleSmall(context).copyWith(
            fontSize: 14,
            color: active ? pal.emerald : pal.textDim,
          ),
        ),
      ),
    );
  }
}
