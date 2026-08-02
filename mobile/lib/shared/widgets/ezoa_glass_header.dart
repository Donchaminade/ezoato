import 'dart:ui';

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

import '../../core/theme/ezoa_theme.dart';

/// Topbar permanent des écrans du shell : bandeau glass plein écran sous la
/// barre de statut système (inset géré ici), avec logo EZOA, titre,
/// sous-titre et action optionnelle (ex. bascule de thème).
class EzoaTopBar extends StatelessWidget {
  const EzoaTopBar({
    super.key,
    required this.title,
    this.subtitle,
    this.showLogo = true,
    this.trailing,
  });

  final String title;
  final String? subtitle;
  final bool showLogo;
  final Widget? trailing;

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);
    final statusBar = MediaQuery.paddingOf(context).top;

    return ClipRect(
      child: BackdropFilter(
        filter: ImageFilter.blur(sigmaX: 10, sigmaY: 10),
        child: Container(
          width: double.infinity,
          padding: EdgeInsets.fromLTRB(16, statusBar + 10, 10, 12),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [pal.appBarFillTop, pal.appBarFillBottom],
            ),
            border: Border(bottom: BorderSide(color: pal.border)),
          ),
          child: Center(
            // Aligné sur EzoaContentWidth (760) pour les grands écrans.
            child: ConstrainedBox(
              constraints: const BoxConstraints(maxWidth: 760),
              child: Row(
                children: [
                  if (showLogo) ...[
                    Builder(builder: (context) {
                      final isDark =
                          Theme.of(context).brightness == Brightness.dark;
                      return Image.asset(
                        'assets/images/icon-ezoa.png',
                        height: 32,
                        fit: BoxFit.contain,
                        // Teinte blanche en mode sombre (traits verts
                        // illisibles sinon).
                        color: isDark ? Colors.white : null,
                        colorBlendMode: isDark ? BlendMode.srcIn : null,
                      );
                    }),
                    const SizedBox(width: 12),
                  ],
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          title,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: GoogleFonts.spaceGrotesk(
                            fontSize: 19,
                            fontWeight: FontWeight.w800,
                            color: pal.text,
                          ),
                        ),
                        if (subtitle != null && subtitle!.isNotEmpty)
                          Text(
                            subtitle!,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: EzoaTypography.bodySmall(context)
                                .copyWith(fontSize: 12),
                          ),
                      ],
                    ),
                  ),
                  if (trailing != null) trailing!,
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

/// Glass app bar for detail/sub screens with back navigation.
class EzoaGlassAppBar extends StatelessWidget implements PreferredSizeWidget {
  const EzoaGlassAppBar({
    super.key,
    required this.title,
    this.actions,
    this.showIcon = true,
  });

  final String title;
  final List<Widget>? actions;
  final bool showIcon;

  @override
  Size get preferredSize => const Size.fromHeight(kToolbarHeight + 8);

  @override
  Widget build(BuildContext context) {
    final pal = EzoaColors.of(context);

    return AppBar(
      backgroundColor: Colors.transparent,
      elevation: 0,
      leading: IconButton(
        icon: const Icon(Icons.arrow_back_ios_new_rounded, size: 20),
        onPressed: () => Navigator.maybePop(context),
      ),
      title: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (showIcon) ...[
            Builder(builder: (context) {
              final isDark = Theme.of(context).brightness == Brightness.dark;
              return Image.asset(
                'assets/images/icon-ezoa.png',
                height: 24,
                fit: BoxFit.contain,
                // Teinte blanche en mode sombre (traits verts illisibles sinon).
                color: isDark ? Colors.white : null,
                colorBlendMode: isDark ? BlendMode.srcIn : null,
              );
            }),
            const SizedBox(width: 10),
          ],
          Flexible(
            child: Text(
              title,
              style: GoogleFonts.spaceGrotesk(
                fontWeight: FontWeight.w700,
                fontSize: 17,
              ),
              overflow: TextOverflow.ellipsis,
            ),
          ),
        ],
      ),
      actions: actions,
      flexibleSpace: ClipRect(
        child: BackdropFilter(
          filter: ImageFilter.blur(sigmaX: 8, sigmaY: 8),
          child: Container(
            decoration: BoxDecoration(
              gradient: LinearGradient(
                begin: Alignment.topCenter,
                end: Alignment.bottomCenter,
                colors: [
                  pal.appBarFillTop,
                  pal.appBarFillBottom,
                ],
              ),
              border: Border(
                bottom: BorderSide(color: pal.border),
              ),
            ),
          ),
        ),
      ),
    );
  }
}
