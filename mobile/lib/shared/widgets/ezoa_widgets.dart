import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:lucide_icons/lucide_icons.dart';

import '../../core/theme/ezoa_theme.dart';
import 'ezoa_glass_card.dart';
import 'ezoa_glass_header.dart';
import 'ezoa_gradient_background.dart';
import 'ezoa_scroll_reveal.dart';

export 'ezoa_glass_card.dart';
export 'ezoa_glass_header.dart';
export 'ezoa_gradient_background.dart';
export 'ezoa_scroll_reveal.dart';
export 'ezoa_theme_toggle.dart';
export 'ezoa_wave_footer.dart';

class EzoaLogo extends StatelessWidget {
  const EzoaLogo({
    super.key,
    this.height = 64,
    this.iconOnly = false,
  });

  final double height;
  final bool iconOnly;

  @override
  Widget build(BuildContext context) {
    // En mode sombre, les traits verts du logo sont illisibles : on le teinte
    // en blanc. En mode clair, on garde le vert d'origine.
    final isDark = Theme.of(context).brightness == Brightness.dark;
    return Image.asset(
      iconOnly ? 'assets/images/icon-ezoa.png' : 'assets/images/logo-ezoa.png',
      height: height,
      fit: BoxFit.contain,
      color: isDark ? Colors.white : null,
      colorBlendMode: isDark ? BlendMode.srcIn : null,
    );
  }
}

/// Contraint le contenu à une largeur lisible et le centre sur les grands
/// écrans (tablettes, paysage, desktop). Transparent sur téléphone.
class EzoaContentWidth extends StatelessWidget {
  const EzoaContentWidth({super.key, required this.child, this.maxWidth = 760});

  final Widget child;
  final double maxWidth;

  @override
  Widget build(BuildContext context) {
    return Align(
      alignment: Alignment.topCenter,
      child: ConstrainedBox(
        constraints: BoxConstraints(maxWidth: maxWidth),
        child: child,
      ),
    );
  }
}

/// Écran d'onglet du shell : topbar permanent ([EzoaTopBar]) + contenu.
///
/// `showWaveFooter` vaut `false` par défaut : sur les onglets du shell la
/// vague décorative passerait derrière la capsule de navigation flottante.
/// Les écrans sans bottom navbar ([EzoaAuthLayout], [EzoaDetailScreen])
/// gardent leurs vagues.
class EzoaScreen extends StatelessWidget {
  const EzoaScreen({
    super.key,
    this.title,
    this.subtitle,
    this.showOfflineBanner = true,
    this.isOnline = true,
    this.loading = false,
    this.useGlassHeader = true,
    this.showLogoInHeader = true,
    this.showWaveFooter = false,
    this.headerTrailing,
    this.headerKey,
    required this.child,
  });

  final String? title;
  final String? subtitle;
  final bool showOfflineBanner;
  final bool isOnline;
  final bool loading;
  final bool useGlassHeader;
  final bool showLogoInHeader;
  final bool showWaveFooter;

  /// Widget affiché à droite du topbar (ex. bouton de thème).
  final Widget? headerTrailing;

  /// Clé optionnelle pour cibler le header (guide de première ouverture).
  final Key? headerKey;
  final Widget child;

  @override
  Widget build(BuildContext context) {
    return EzoaScaffold(
      showWaveFooter: showWaveFooter,
      body: Column(
        children: [
          if (title != null && useGlassHeader)
            EzoaTopBar(
              key: headerKey,
              title: title!,
              subtitle: subtitle,
              showLogo: showLogoInHeader,
              trailing: headerTrailing,
            ),
          if (showOfflineBanner && !isOnline) const OfflineBanner(),
          Expanded(
            child: loading
                ? const Center(child: EzoaGlassLoader())
                : EzoaContentWidth(child: child),
          ),
        ],
      ),
    );
  }
}

class EzoaGlassLoader extends StatelessWidget {
  const EzoaGlassLoader({super.key, this.size = 48});

  final double size;

  @override
  Widget build(BuildContext context) {
    return EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: const EdgeInsets.all(20),
      enableShine: false,
      blurSigma: 20,
      child: SizedBox(
        width: size,
        height: size,
        child: CircularProgressIndicator(
          strokeWidth: 2.5,
          color: EzoaColors.of(context).accent.withValues(alpha: 0.9),
        ),
      ),
    );
  }
}

class OfflineBanner extends StatelessWidget {
  const OfflineBanner({super.key});

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
        child: Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(vertical: 10, horizontal: 16),
          decoration: BoxDecoration(
            color: pal.offlineFill,
            border: Border(
              bottom: BorderSide(color: pal.border),
            ),
          ),
          child: Row(
            children: [
              Icon(LucideIcons.cloudOff, color: pal.offlineText, size: 16),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  'Mode hors ligne — contenu local uniquement',
                  style: GoogleFonts.inter(
                    color: pal.offlineText,
                    fontSize: 13,
                    fontWeight: FontWeight.w300,
                  ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class EzoaButton extends StatelessWidget {
  const EzoaButton({
    super.key,
    required this.label,
    required this.onPressed,
    this.loading = false,
    this.variant = EzoaButtonVariant.primary,
    this.disabled = false,
    this.icon,
  });

  final String label;
  final VoidCallback? onPressed;
  final bool loading;
  final EzoaButtonVariant variant;
  final bool disabled;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final child = loading
        ? SizedBox(
            height: 22,
            width: 22,
            child: CircularProgressIndicator(
              strokeWidth: 2,
              color: variant == EzoaButtonVariant.outline
                  ? EzoaColors.of(context).accent
                  : Colors.white,
            ),
          )
        : Row(
            mainAxisAlignment: MainAxisAlignment.center,
            mainAxisSize: MainAxisSize.min,
            children: [
              if (icon != null) ...[
                Icon(icon, size: 18),
                const SizedBox(width: 8),
              ],
              Text(label),
            ],
          );

    final enabled = !disabled && !loading && onPressed != null;

    Widget button;
    if (variant == EzoaButtonVariant.outline) {
      button = OutlinedButton(
        onPressed: enabled ? onPressed : null,
        child: child,
      );
    } else if (variant == EzoaButtonVariant.secondary) {
      button = ElevatedButton(
        style: ElevatedButton.styleFrom(
          backgroundColor: EzoaColors.accentBlue,
          foregroundColor: Colors.white,
        ),
        onPressed: enabled ? onPressed : null,
        child: child,
      );
    } else if (variant == EzoaButtonVariant.ghost) {
      button = TextButton(
        onPressed: enabled ? onPressed : null,
        child: child,
      );
    } else {
      button = ElevatedButton(
        onPressed: enabled ? onPressed : null,
        child: child,
      );
    }

    return _PressScale(enabled: enabled, child: button);
  }
}

enum EzoaButtonVariant { primary, secondary, outline, ghost }

/// Micro-interaction : léger rétrécissement (0.97) au press, easeOut 150 ms.
class _PressScale extends StatefulWidget {
  const _PressScale({required this.child, this.enabled = true});

  final Widget child;
  final bool enabled;

  @override
  State<_PressScale> createState() => _PressScaleState();
}

class _PressScaleState extends State<_PressScale> {
  bool _pressed = false;

  @override
  Widget build(BuildContext context) {
    return Listener(
      onPointerDown: widget.enabled ? (_) => setState(() => _pressed = true) : null,
      onPointerUp: (_) => setState(() => _pressed = false),
      onPointerCancel: (_) => setState(() => _pressed = false),
      child: AnimatedScale(
        scale: _pressed ? 0.97 : 1.0,
        duration: const Duration(milliseconds: 150),
        curve: Curves.easeOut,
        child: widget.child,
      ),
    );
  }
}

class EzoaTextField extends StatelessWidget {
  const EzoaTextField({
    super.key,
    required this.label,
    required this.controller,
    this.obscureText = false,
    this.keyboardType,
    this.errorText,
    this.onChanged,
    this.prefixIcon,
  });

  final String label;
  final TextEditingController controller;
  final bool obscureText;
  final TextInputType? keyboardType;
  final String? errorText;
  final ValueChanged<String>? onChanged;
  final IconData? prefixIcon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Padding(
      padding: const EdgeInsets.only(bottom: 14),
      child: TextField(
        controller: controller,
        obscureText: obscureText,
        keyboardType: keyboardType,
        onChanged: onChanged,
        style: GoogleFonts.inter(
          color: pal.text,
          fontWeight: FontWeight.w300,
        ),
        decoration: InputDecoration(
          labelText: label,
          errorText: errorText,
          prefixIcon: prefixIcon != null
              ? Icon(prefixIcon, size: 20, color: pal.textFaint)
              : null,
        ),
      ),
    );
  }
}

class EzoaSearchField extends StatelessWidget {
  const EzoaSearchField({
    super.key,
    required this.controller,
    this.hintText = 'Rechercher…',
    this.enabled = true,
    this.onChanged,
  });

  final TextEditingController controller;
  final String hintText;
  final bool enabled;
  final ValueChanged<String>? onChanged;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      margin: const EdgeInsets.fromLTRB(16, 8, 16, 8),
      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      enableShine: false,
      blurSigma: 14,
      child: TextField(
        controller: controller,
        enabled: enabled,
        onChanged: onChanged,
        style: GoogleFonts.inter(
          color: pal.text,
          fontWeight: FontWeight.w300,
        ),
        decoration: InputDecoration(
          hintText: hintText,
          border: InputBorder.none,
          enabledBorder: InputBorder.none,
          focusedBorder: InputBorder.none,
          filled: false,
          prefixIcon: Icon(
            LucideIcons.search,
            size: 20,
            color: enabled ? pal.accent : pal.textFaint,
          ),
          contentPadding: const EdgeInsets.symmetric(vertical: 12),
        ),
      ),
    );
  }
}

class EmptyState extends StatelessWidget {
  const EmptyState({
    super.key,
    required this.title,
    this.message,
    this.icon = LucideIcons.inbox,
  });

  final String title;
  final String? message;
  final IconData icon;

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: EzoaGlassCard(
          margin: EdgeInsets.zero,
          enableShine: false,
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Icon(
                icon,
                size: 48,
                color: EzoaColors.of(context).textFaint.withValues(alpha: 0.6),
              ),
              const SizedBox(height: 16),
              Text(
                title,
                style: EzoaTypography.titleMedium(context),
                textAlign: TextAlign.center,
              ),
              if (message != null) ...[
                const SizedBox(height: 8),
                Text(
                  message!,
                  style: EzoaTypography.body(context),
                  textAlign: TextAlign.center,
                ),
              ],
            ],
          ),
        ),
      ),
    );
  }
}

/// Format compact d'un compteur : 845 → « 845 », 1240 → « 1,2 k »,
/// 13500 → « 13 k », 2400000 → « 2,4 M ».
String formatCompteurCompact(int n) {
  String compact(double v, String suffixe) {
    final texte = v < 10 && v != v.truncateToDouble()
        ? v.toStringAsFixed(1).replaceAll('.', ',')
        : v.truncate().toString();
    return '$texte $suffixe';
  }

  if (n >= 1000000) return compact(n / 1000000, 'M');
  if (n >= 1000) return compact(n / 1000, 'k');
  return '$n';
}

class EpreuveCard extends StatelessWidget {
  const EpreuveCard({
    super.key,
    required this.titre,
    required this.matiere,
    required this.meta,
    required this.onTap,
    this.telechargements,
    this.isOffline = false,
    this.isFavorite = false,
    this.downloading = false,
    this.onDownload,
    this.revealIndex,
  });

  final String titre;
  final String matiere;
  final String meta;
  final VoidCallback onTap;
  final int? telechargements;
  final bool isOffline;
  final bool isFavorite;
  final bool downloading;
  final VoidCallback? onDownload;
  final int? revealIndex;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final card = EzoaGlassCard(
      onTap: onTap,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  gradient: LinearGradient(
                    colors: [
                      EzoaColors.primary.withValues(alpha: 0.9),
                      EzoaColors.primaryDark,
                    ],
                  ),
                  borderRadius: BorderRadius.circular(8),
                  border: Border.all(
                    color: EzoaColors.emerald.withValues(alpha: 0.3),
                  ),
                ),
                child: Text(
                  matiere.toUpperCase(),
                  style: EzoaTypography.badge(context).copyWith(
                    color: Colors.white,
                    fontSize: 9,
                  ),
                ),
              ),
              const Spacer(),
              if (isFavorite)
                Icon(LucideIcons.heart, color: pal.error, size: 16),
              if (isOffline)
                Padding(
                  padding: const EdgeInsets.only(left: 8),
                  child: Icon(
                    LucideIcons.hardDrive,
                    color: pal.emerald,
                    size: 16,
                  ),
                ),
            ],
          ),
          const SizedBox(height: 10),
          Text(
            titre,
            style: GoogleFonts.spaceGrotesk(
              fontSize: 16,
              fontWeight: FontWeight.w600,
              color: pal.text,
            ),
            maxLines: 2,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 6),
          Text(
            meta.toUpperCase(),
            style: EzoaTypography.badge(context).copyWith(
              color: pal.textDim,
              fontSize: 9,
            ),
          ),
          if (telechargements != null) ...[
            const SizedBox(height: 8),
            Container(
              padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
              decoration: BoxDecoration(
                color: pal.subtleFill,
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: pal.border),
              ),
              child: Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(
                    LucideIcons.download,
                    size: 12,
                    color: pal.textDim,
                  ),
                  const SizedBox(width: 4),
                  Text(
                    formatCompteurCompact(telechargements!),
                    style: EzoaTypography.badge(context).copyWith(
                      color: pal.textDim,
                      fontSize: 10,
                    ),
                  ),
                ],
              ),
            ),
          ],
          if (onDownload != null) ...[
            const SizedBox(height: 12),
            Align(
              alignment: Alignment.centerRight,
              child: TextButton.icon(
                onPressed: downloading ? null : onDownload,
                icon: downloading
                    ? const SizedBox(
                        width: 16,
                        height: 16,
                        child: CircularProgressIndicator(strokeWidth: 2),
                      )
                    : Icon(LucideIcons.download, size: 16),
                label: Text(downloading ? 'Téléchargement…' : 'Télécharger'),
              ),
            ),
          ],
        ],
      ),
    );

    if (revealIndex != null) {
      return EzoaStaggerReveal(index: revealIndex!, child: card);
    }
    return card;
  }
}

/// Carte épreuve verticale pour grilles 2 colonnes (Archives, Favoris…).
class EpreuveGridCard extends StatelessWidget {
  const EpreuveGridCard({
    super.key,
    required this.titre,
    required this.matiere,
    required this.classe,
    required this.annee,
    required this.onTap,
    this.onLongPress,
    this.ville,
    this.telechargements,
    this.isFavorite = false,
    this.isOffline = false,
    this.type = 'epreuve',
    this.revealIndex,
  });

  final String titre;
  final String matiere;
  final String classe;
  final int annee;
  final String? ville;
  final int? telechargements;
  final bool isFavorite;
  final bool isOffline;
  final String type;
  final VoidCallback onTap;
  final VoidCallback? onLongPress;
  final int? revealIndex;

  static const _gradients = [
    [Color(0xFF006A4E), Color(0xFF004D38)],
    [Color(0xFF4338CA), Color(0xFF312E81)],
    [Color(0xFF0E7490), Color(0xFF155E75)],
    [Color(0xFF7C3AED), Color(0xFF5B21B6)],
    [Color(0xFFB45309), Color(0xFF92400E)],
  ];

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final gradient = _gradients[matiere.hashCode.abs() % _gradients.length];

    final card = EzoaGlassCard(
      margin: EdgeInsets.zero,
      padding: EdgeInsets.zero,
      enableShine: false,
      onTap: onTap,
      onLongPress: onLongPress,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          Container(
            height: 82,
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
                colors: gradient,
              ),
            ),
            child: Stack(
              children: [
                Center(
                  child: Icon(
                    type == 'examen'
                        ? LucideIcons.graduationCap
                        : LucideIcons.fileText,
                    size: 30,
                    color: Colors.white.withValues(alpha: 0.85),
                  ),
                ),
                if (isFavorite || isOffline)
                  Positioned(
                    top: 8,
                    right: 8,
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        if (isFavorite)
                          Icon(LucideIcons.heart, color: pal.error, size: 14),
                        if (isOffline) ...[
                          if (isFavorite) const SizedBox(width: 6),
                          Icon(
                            LucideIcons.hardDrive,
                            color: pal.emerald,
                            size: 14,
                          ),
                        ],
                      ],
                    ),
                  ),
              ],
            ),
          ),
          Expanded(
            child: Padding(
              padding: const EdgeInsets.all(10),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    titre,
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                    style: GoogleFonts.spaceGrotesk(
                      fontSize: 13,
                      fontWeight: FontWeight.w600,
                      color: pal.text,
                      height: 1.25,
                    ),
                  ),
                  const Spacer(),
                  Wrap(
                    spacing: 4,
                    runSpacing: 4,
                    children: [
                      _EpreuveMiniBadge(label: matiere),
                      _EpreuveMiniBadge(label: classe),
                      _EpreuveMiniBadge(label: '$annee'),
                      if (ville != null && ville!.isNotEmpty)
                        _EpreuveMiniBadge(label: ville!),
                      if (telechargements != null && telechargements! > 0)
                        _EpreuveMiniBadge(
                          label: formatCompteurCompact(telechargements!),
                          icon: LucideIcons.download,
                        ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ],
      ),
    );

    if (revealIndex != null) {
      return EzoaStaggerReveal(index: revealIndex! % 6, child: card);
    }
    return card;
  }
}

class _EpreuveMiniBadge extends StatelessWidget {
  const _EpreuveMiniBadge({required this.label, this.icon});

  final String label;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
      decoration: BoxDecoration(
        color: pal.subtleFill,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: pal.border),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (icon != null) ...[
            Icon(icon, size: 9, color: pal.textDim),
            const SizedBox(width: 3),
          ],
          Flexible(
            child: Text(
              label.toUpperCase(),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
              style: GoogleFonts.jetBrainsMono(
                fontSize: 7.5,
                fontWeight: FontWeight.w600,
                letterSpacing: 0.6,
                color: pal.textDim,
              ),
            ),
          ),
        ],
      ),
    );
  }
}

/// Grille catalogue 2 colonnes avec gouttières 12 px et padding horizontal 16 px.
class EpreuvesGrid extends StatelessWidget {
  const EpreuvesGrid({
    super.key,
    required this.itemCount,
    required this.itemBuilder,
    this.topPadding = 8,
    this.bottomPadding = 24,
  });

  final int itemCount;
  final Widget Function(BuildContext context, int index) itemBuilder;
  final double topPadding;
  final double bottomPadding;

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      padding: EdgeInsets.fromLTRB(16, topPadding, 16, bottomPadding),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        mainAxisSpacing: 12,
        crossAxisSpacing: 12,
        mainAxisExtent: 204,
      ),
      itemCount: itemCount,
      itemBuilder: itemBuilder,
    );
  }
}

class StatChip extends StatelessWidget {
  const StatChip({
    super.key,
    required this.label,
    required this.value,
    this.icon,
    this.onTap,
  });

  final String label;
  final int value;
  final IconData? icon;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return EzoaGlassStat(
      label: label,
      value: value,
      icon: icon,
      onTap: onTap,
    );
  }
}

/// Centered auth form layout with glass card and wave footer.
class EzoaAuthLayout extends StatelessWidget {
  const EzoaAuthLayout({
    super.key,
    required this.title,
    required this.subtitle,
    required this.children,
    this.showBack = false,
    this.onBack,
  });

  final String title;
  final String subtitle;
  final List<Widget> children;
  final bool showBack;
  final VoidCallback? onBack;

  @override
  Widget build(BuildContext context) {
    // Hauteur du clavier : le Scaffold ne se redimensionne pas
    // (resizeToAvoidBottomInset: false) pour que les vagues restent fixes au
    // bas de l'écran physique ; on compense ici dans le padding du scroll.
    final keyboardInset = MediaQuery.viewInsetsOf(context).bottom;

    return EzoaScaffold(
      showWaveFooter: true,
      resizeToAvoidBottomInset: false,
      body: SafeArea(
        child: LayoutBuilder(
          builder: (context, constraints) {
            return SingleChildScrollView(
              keyboardDismissBehavior: ScrollViewKeyboardDismissBehavior.onDrag,
              padding: EdgeInsets.fromLTRB(24, 16, 24, 32 + keyboardInset),
              child: ConstrainedBox(
                // 48 = padding vertical (16 haut + 32 bas) hors clavier, pour
                // que le bloc soit centré sur la hauteur visible restante.
                constraints: BoxConstraints(
                  minHeight: (constraints.maxHeight - keyboardInset - 48)
                      .clamp(0.0, double.infinity),
                ),
                child: Center(
                  child: EzoaContentWidth(
                    maxWidth: 480,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        if (showBack)
                          Align(
                            alignment: Alignment.centerLeft,
                            child: IconButton(
                              icon: Icon(
                                LucideIcons.arrowLeft,
                                color: EzoaColors.of(context).textMuted,
                              ),
                              onPressed: onBack,
                            ),
                          ),
                        const SizedBox(height: 8),
                        const Center(child: EzoaLogo(height: 88)),
                        const SizedBox(height: 32),
                        EzoaGlassCard(
                          margin: EdgeInsets.zero,
                          padding: const EdgeInsets.all(24),
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.stretch,
                            children: [
                              Text(title, style: EzoaTypography.titleLarge(context)),
                              const SizedBox(height: 8),
                              Text(subtitle, style: EzoaTypography.body(context)),
                              const SizedBox(height: 24),
                              ...children,
                            ],
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
              ),
            );
          },
        ),
      ),
    );
  }
}

/// Élément de la barre de navigation flottante [EzoaGlassNavBar].
class EzoaNavBarItem {
  const EzoaNavBarItem({
    required this.icon,
    required this.label,
    this.showBadge = false,
  });

  final IconData icon;
  final String label;
  final bool showBadge;
}

/// Capsule de navigation flottante en verre dépoli avec bouton central
/// surélevé (type FAB) qui déborde au-dessus de la capsule.
///
/// Charte drapeau togolais : icônes/labels noirs par défaut, sélection en
/// vert #006A4E avec micro-accent jaune #FFCE00, bouton central vert.
/// Le fond reste un verre blanc clair dans les deux modes pour garder les
/// éléments noirs lisibles.
///
/// La hauteur du widget reste celle de la capsule (le Stack utilise
/// `clipBehavior: Clip.none` pour laisser le bouton central déborder vers le
/// haut sans agrandir le slot bottomNavigationBar — la capsule reste donc
/// bien ancrée en bas, sans réintroduire le bug de la capsule flottante).
class EzoaGlassNavBar extends StatelessWidget {
  const EzoaGlassNavBar({
    super.key,
    required this.selectedIndex,
    required this.onDestinationSelected,
    required this.items,
    this.centerIndex = 2,
    this.barKey,
    this.centerButtonKey,
  });

  final int selectedIndex;
  final ValueChanged<int> onDestinationSelected;
  final List<EzoaNavBarItem> items;

  /// Index de l'élément rendu comme bouton central surélevé.
  final int centerIndex;

  /// Clé optionnelle pour cibler la capsule de navigation.
  final Key? barKey;

  /// Clé optionnelle pour cibler le bouton central « Soumettre ».
  final Key? centerButtonKey;

  static const double _height = 64;
  static const double _centerSize = 62;

  /// Débordement du bouton central au-dessus de la capsule.
  static const double _centerOverhang = 22;

  // Charte drapeau togolais (identique aux deux modes).
  static const Color _itemColor = Color(0xFF18181B); // noir par défaut
  static const Color _selectedColor = EzoaColors.primary; // vert #006A4E
  static const Color _accentDot = EzoaColors.gold; // jaune #FFCE00

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final radius = BorderRadius.circular(_height / 2);

    // Verre blanc clair dans les DEUX modes : les icônes/labels noirs
    // restent lisibles, y compris en mode sombre.
    final fill = Colors.white.withValues(alpha: pal.isDark ? 0.86 : 0.80);

    // Un seul SafeArea ici : il consomme l'encoche basse pour son enfant
    // (pas de double marge système).
    return SafeArea(
      top: false,
      minimum: const EdgeInsets.fromLTRB(16, 0, 16, 12),
      // heightFactor: 1.0 → le Center ne prend que la hauteur de la capsule
      // (sans lui, il remplirait toute la hauteur offerte au slot
      // bottomNavigationBar et la capsule flotterait au milieu de l'écran).
      child: Center(
        heightFactor: 1.0,
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 560),
          child: SizedBox(
            key: barKey,
            height: _height,
            child: Stack(
              clipBehavior: Clip.none,
              children: [
                Positioned.fill(
                  child: DecoratedBox(
                    decoration: BoxDecoration(
                      borderRadius: radius,
                      boxShadow: [
                        BoxShadow(
                          color: pal.shadowStrong,
                          blurRadius: 28,
                          offset: const Offset(0, 10),
                        ),
                      ],
                    ),
                    child: ClipRRect(
                      borderRadius: radius,
                      child: BackdropFilter(
                        filter: ImageFilter.blur(sigmaX: 24, sigmaY: 24),
                        child: Container(
                          decoration: BoxDecoration(
                            color: fill,
                            borderRadius: radius,
                            border: Border.all(
                              color: Colors.black.withValues(alpha: 0.08),
                            ),
                          ),
                          child: Row(
                            children: [
                              for (var i = 0; i < items.length; i++)
                                Expanded(
                                  child: i == centerIndex
                                      ? _CenterLabel(
                                          label: items[i].label,
                                          selected: i == selectedIndex,
                                          onTap: () =>
                                              onDestinationSelected(i),
                                        )
                                      : _NavBarSlot(
                                          item: items[i],
                                          selected: i == selectedIndex,
                                          onTap: () =>
                                              onDestinationSelected(i),
                                        ),
                                ),
                            ],
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
                // Bouton central surélevé : positionné en négatif, il déborde
                // au-dessus de la capsule sans modifier la hauteur du widget.
                Positioned(
                  top: -_centerOverhang,
                  left: 0,
                  right: 0,
                  child: Center(
                    child: _PressScale(
                      child: GestureDetector(
                        onTap: () => onDestinationSelected(centerIndex),
                        child: Container(
                          key: centerButtonKey,
                          width: _centerSize,
                          height: _centerSize,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            gradient: const LinearGradient(
                              begin: Alignment.topLeft,
                              end: Alignment.bottomRight,
                              colors: [
                                EzoaColors.primary,
                                EzoaColors.primaryDark,
                              ],
                            ),
                            border: Border.all(
                              color: Colors.white.withValues(alpha: 0.9),
                              width: 3,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: EzoaColors.primary
                                    .withValues(alpha: 0.45),
                                blurRadius: 18,
                                offset: const Offset(0, 6),
                              ),
                            ],
                          ),
                          child: const Icon(
                            LucideIcons.upload,
                            color: Colors.white,
                            size: 26,
                          ),
                        ),
                      ),
                    ),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}

/// Slot standard de la capsule : icône + label, noir par défaut, vert
/// togolais à la sélection avec un point jaune en micro-accent.
class _NavBarSlot extends StatelessWidget {
  const _NavBarSlot({
    required this.item,
    required this.selected,
    required this.onTap,
  });

  final EzoaNavBarItem item;
  final bool selected;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    final color = selected
        ? EzoaGlassNavBar._selectedColor
        : EzoaGlassNavBar._itemColor;

    return GestureDetector(
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Stack(
            clipBehavior: Clip.none,
            children: [
              Icon(item.icon, size: 22, color: color),
              if (item.showBadge)
                Positioned(
                  right: -2,
                  top: -2,
                  child: Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: EzoaColors.error,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white, width: 1.5),
                    ),
                  ),
                ),
            ],
          ),
          const SizedBox(height: 3),
          Text(
            item.label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w400,
              color: color,
            ),
          ),
          const SizedBox(height: 2),
          AnimatedContainer(
            duration: const Duration(milliseconds: 200),
            width: selected ? 4 : 0,
            height: 4,
            decoration: const BoxDecoration(
              color: EzoaGlassNavBar._accentDot,
              shape: BoxShape.circle,
            ),
          ),
        ],
      ),
    );
  }
}

/// Slot central : seul le label apparaît dans la capsule, le bouton rond
/// surélevé est dessiné par-dessus dans le Stack parent.
class _CenterLabel extends StatelessWidget {
  const _CenterLabel({
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
      behavior: HitTestBehavior.opaque,
      onTap: onTap,
      child: Align(
        alignment: Alignment.bottomCenter,
        child: Padding(
          padding: const EdgeInsets.only(bottom: 6),
          child: Text(
            label,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
            style: GoogleFonts.inter(
              fontSize: 11,
              fontWeight: selected ? FontWeight.w600 : FontWeight.w500,
              color: selected
                  ? EzoaGlassNavBar._selectedColor
                  : EzoaGlassNavBar._itemColor,
            ),
          ),
        ),
      ),
    );
  }
}

/// Detail screen scaffold with glass app bar.
class EzoaDetailScreen extends StatelessWidget {
  const EzoaDetailScreen({
    super.key,
    required this.title,
    required this.body,
    this.loading = false,
    this.actions,
    this.showWaveFooter = true,
  });

  final String title;
  final Widget body;
  final bool loading;
  final List<Widget>? actions;
  final bool showWaveFooter;

  @override
  Widget build(BuildContext context) {
    // EzoaScaffold étend le body derrière l'app bar (extendBodyBehindAppBar) :
    // sans ce padding, le contenu démarrerait sous l'app bar glass.
    final topInset =
        MediaQuery.paddingOf(context).top + kToolbarHeight + 8 + 4;

    return EzoaScaffold(
      appBar: EzoaGlassAppBar(title: title, actions: actions),
      showWaveFooter: showWaveFooter,
      body: Padding(
        padding: EdgeInsets.only(top: topInset),
        child: loading
            ? const Center(child: EzoaGlassLoader())
            : EzoaContentWidth(child: body),
      ),
    );
  }
}

/// Glass menu tile for account screens.
class EzoaMenuTile extends StatelessWidget {
  const EzoaMenuTile({
    super.key,
    required this.title,
    required this.subtitle,
    required this.onTap,
    this.icon,
  });

  final String title;
  final String subtitle;
  final VoidCallback onTap;
  final IconData? icon;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return EzoaGlassCard(
      onTap: onTap,
      child: Row(
        children: [
          if (icon != null) ...[
            Container(
              padding: const EdgeInsets.all(10),
              decoration: BoxDecoration(
                color: EzoaColors.primary.withValues(alpha: 0.15),
                borderRadius: BorderRadius.circular(12),
                border: Border.all(color: pal.border),
              ),
              child: Icon(icon, size: 20, color: pal.accent),
            ),
            const SizedBox(width: 14),
          ],
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(title, style: EzoaTypography.titleSmall(context)),
                const SizedBox(height: 2),
                Text(subtitle, style: EzoaTypography.bodySmall(context)),
              ],
            ),
          ),
          Icon(LucideIcons.chevronRight, size: 18, color: pal.textFaint),
        ],
      ),
    );
  }
}
