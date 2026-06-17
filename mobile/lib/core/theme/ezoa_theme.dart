import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Constantes de marque (identiques dans les deux modes) + accès à la
/// palette résolue selon la brightness courante via [EzoaColors.of].
class EzoaColors {
  // Brand
  static const primary = Color(0xFF006A4E);
  static const primaryDark = Color(0xFF004D38);
  static const accent = Color(0xFFA5B4FC);
  static const accentBlue = Color(0xFF6366F1);
  static const emerald = Color(0xFF34D399);
  static const gold = Color(0xFFFFCE00);
  static const error = Color(0xFFF87171);

  // Dark premium palette (valeurs historiques, mode sombre)
  static const zinc950 = Color(0xFF09090B);
  static const cobaltNight = Color(0xFF1E2436);
  static const cobaltDeep = Color(0xFF181E30);
  static const zinc300 = Color(0xFFD4D4D8);
  static const zinc400 = Color(0xFFA1A1AA);
  static const zinc500 = Color(0xFF71717A);

  /// Palette adaptée à la brightness du thème courant.
  static EzoaPalette of(BuildContext context) => EzoaPalette.of(context);
}

/// Palette résolue selon la brightness : sombre = rendu historique
/// « Glassmorphism Dark Premium », clair = même charte sur fond clair.
class EzoaPalette {
  const EzoaPalette({
    required this.brightness,
    required this.text,
    required this.textMuted,
    required this.textDim,
    required this.textFaint,
    required this.accent,
    required this.emerald,
    required this.gold,
    required this.error,
    required this.background,
    required this.surfaceSolid,
    required this.border,
    required this.borderStrong,
    required this.glassFill,
    required this.glassSheenTop,
    required this.glassSheenBottom,
    required this.subtleFill,
    required this.inputFill,
    required this.shadow,
    required this.shadowStrong,
    required this.capsuleFill,
    required this.navBarFill,
    required this.appBarFillTop,
    required this.appBarFillBottom,
    required this.dialogBg,
    required this.offlineFill,
    required this.offlineText,
    required this.gridLine,
    required this.curveLine,
    required this.progressTrack,
    required this.shineStrong,
    required this.shineSoft,
    required this.gradientStops,
  });

  final Brightness brightness;

  // Textes
  final Color text;
  final Color textMuted;
  final Color textDim;
  final Color textFaint;

  // Accents lisibles selon le fond
  final Color accent;
  final Color emerald;
  final Color gold;
  final Color error;

  // Surfaces, verre et décor
  final Color background;
  final Color surfaceSolid;
  final Color border;
  final Color borderStrong;
  final Color glassFill;
  final Color glassSheenTop;
  final Color glassSheenBottom;
  final Color subtleFill;
  final Color inputFill;
  final Color shadow;
  final Color shadowStrong;
  final Color capsuleFill;
  final Color navBarFill;
  final Color appBarFillTop;
  final Color appBarFillBottom;
  final Color dialogBg;
  final Color offlineFill;
  final Color offlineText;
  final Color gridLine;
  final Color curveLine;
  final Color progressTrack;
  final Color shineStrong;
  final Color shineSoft;
  final List<Color> gradientStops;

  bool get isDark => brightness == Brightness.dark;

  static EzoaPalette of(BuildContext context) =>
      Theme.of(context).brightness == Brightness.dark ? dark : light;

  /// Rendu sombre historique (valeurs inchangées).
  static const dark = EzoaPalette(
    brightness: Brightness.dark,
    text: Colors.white,
    textMuted: EzoaColors.zinc300,
    textDim: EzoaColors.zinc400,
    textFaint: EzoaColors.zinc500,
    accent: EzoaColors.accent,
    emerald: EzoaColors.emerald,
    gold: EzoaColors.gold,
    error: EzoaColors.error,
    background: EzoaColors.zinc950,
    surfaceSolid: Color(0xFF12141C),
    border: Color(0x14FFFFFF),
    borderStrong: Color(0x1AFFFFFF),
    glassFill: Color(0x0DFFFFFF),
    glassSheenTop: Color(0x14FFFFFF),
    glassSheenBottom: Color(0x05FFFFFF),
    subtleFill: Color(0x0DFFFFFF),
    inputFill: Color(0x0AFFFFFF),
    shadow: Color(0x59000000),
    shadowStrong: Color(0x73000000),
    capsuleFill: Color(0x0FFFFFFF),
    navBarFill: Color(0xC7181E30),
    appBarFillTop: Color(0xD9181E30),
    appBarFillBottom: Color(0x66181E30),
    dialogBg: EzoaColors.cobaltNight,
    offlineFill: Color(0xD952525B),
    offlineText: EzoaColors.zinc300,
    gridLine: Color(0x06FFFFFF),
    curveLine: Color(0x0AFFFFFF),
    progressTrack: Color(0x1AFFFFFF),
    shineStrong: Color(0x1AFFFFFF),
    shineSoft: Color(0x0AFFFFFF),
    gradientStops: [
      EzoaColors.zinc950,
      EzoaColors.cobaltDeep,
      EzoaColors.cobaltNight,
      EzoaColors.cobaltDeep,
      EzoaColors.zinc950,
    ],
  );

  /// Mode clair : même charte (vert EZOA, indigo, emerald) sur fond
  /// zinc-50 / bleu très pâle, panneaux blanc/70, textes zinc-900/600.
  static const light = EzoaPalette(
    brightness: Brightness.light,
    text: Color(0xFF18181B),
    textMuted: Color(0xFF52525B),
    textDim: Color(0xFF71717A),
    textFaint: Color(0xFFA1A1AA),
    accent: Color(0xFF4F46E5),
    emerald: Color(0xFF059669),
    gold: Color(0xFFB45309),
    error: Color(0xFFDC2626),
    background: Color(0xFFFAFAFA),
    surfaceSolid: Colors.white,
    border: Color(0x14000000),
    borderStrong: Color(0x1F000000),
    glassFill: Color(0xB3FFFFFF),
    glassSheenTop: Color(0xD9FFFFFF),
    glassSheenBottom: Color(0x8CFFFFFF),
    subtleFill: Color(0x0A000000),
    inputFill: Color(0x0A000000),
    shadow: Color(0x1A0F172A),
    shadowStrong: Color(0x240F172A),
    capsuleFill: Color(0xA6FFFFFF),
    navBarFill: Color(0xD9FFFFFF),
    appBarFillTop: Color(0xE0FFFFFF),
    appBarFillBottom: Color(0x8CFFFFFF),
    dialogBg: Colors.white,
    offlineFill: Color(0xEBE4E4E7),
    offlineText: Color(0xFF3F3F46),
    gridLine: Color(0x09000000),
    curveLine: Color(0x0D000000),
    progressTrack: Color(0x14000000),
    shineStrong: Color(0x73FFFFFF),
    shineSoft: Color(0x33FFFFFF),
    gradientStops: [
      Color(0xFFFAFAFA),
      Color(0xFFF1F5F9),
      Color(0xFFE3ECF8),
      Color(0xFFF1F5F9),
      Color(0xFFFAFAFA),
    ],
  );
}

class EzoaTypography {
  static TextStyle titleLarge(BuildContext context) => GoogleFonts.spaceGrotesk(
        fontSize: 26,
        fontWeight: FontWeight.w800,
        color: EzoaColors.of(context).text,
        letterSpacing: -0.5,
      );

  static TextStyle titleMedium(BuildContext context) => GoogleFonts.spaceGrotesk(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: EzoaColors.of(context).text,
      );

  static TextStyle titleSmall(BuildContext context) => GoogleFonts.spaceGrotesk(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: EzoaColors.of(context).text,
      );

  static TextStyle body(BuildContext context) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w300,
        color: EzoaColors.of(context).textMuted,
        height: 1.5,
      );

  static TextStyle bodySmall(BuildContext context) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w300,
        color: EzoaColors.of(context).textDim,
      );

  static TextStyle badge(BuildContext context) => GoogleFonts.jetBrainsMono(
        fontSize: 10,
        fontWeight: FontWeight.w600,
        color: EzoaColors.of(context).accent,
        letterSpacing: 1.2,
      );

  static TextStyle mono(BuildContext context) => GoogleFonts.jetBrainsMono(
        fontSize: 12,
        fontWeight: FontWeight.w500,
        color: EzoaColors.of(context).accent,
      );
}

class EzoaTheme {
  static ThemeData get dark => _build(EzoaPalette.dark);

  static ThemeData get light => _build(EzoaPalette.light);

  static ThemeData _build(EzoaPalette pal) {
    final titleFont = GoogleFonts.spaceGroteskTextTheme();
    final bodyFont = GoogleFonts.interTextTheme();
    final isDark = pal.isDark;

    final colorScheme = isDark
        ? ColorScheme.dark(
            primary: EzoaColors.primary,
            secondary: pal.accent,
            surface: pal.surfaceSolid,
            error: pal.error,
            onPrimary: Colors.white,
            onSurface: pal.text,
          )
        : ColorScheme.light(
            primary: EzoaColors.primary,
            secondary: pal.accent,
            surface: pal.surfaceSolid,
            error: pal.error,
            onPrimary: Colors.white,
            onSurface: pal.text,
          );

    return ThemeData(
      useMaterial3: true,
      brightness: pal.brightness,
      colorScheme: colorScheme,
      scaffoldBackgroundColor: pal.background,
      textTheme: bodyFont.apply(
        bodyColor: pal.textMuted,
        displayColor: pal.text,
      ).copyWith(
        headlineLarge: titleFont.headlineLarge?.copyWith(
          fontWeight: FontWeight.w800,
          color: pal.text,
        ),
        headlineMedium: titleFont.headlineMedium?.copyWith(
          fontWeight: FontWeight.w700,
          color: pal.text,
        ),
        titleLarge: titleFont.titleLarge?.copyWith(
          fontWeight: FontWeight.w700,
          color: pal.text,
        ),
        titleMedium: titleFont.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
          color: pal.text,
        ),
        bodyLarge: bodyFont.bodyLarge?.copyWith(
          fontWeight: FontWeight.w300,
          color: pal.textMuted,
        ),
        bodyMedium: bodyFont.bodyMedium?.copyWith(
          fontWeight: FontWeight.w300,
          color: pal.textMuted,
        ),
        labelSmall: GoogleFonts.jetBrainsMono(
          fontSize: 10,
          fontWeight: FontWeight.w600,
          color: pal.accent,
          letterSpacing: 1.2,
        ),
      ),
      appBarTheme: AppBarTheme(
        backgroundColor: Colors.transparent,
        foregroundColor: pal.text,
        elevation: 0,
        centerTitle: false,
        scrolledUnderElevation: 0,
        titleTextStyle: GoogleFonts.spaceGrotesk(
          fontSize: 18,
          fontWeight: FontWeight.w700,
          color: pal.text,
        ),
        iconTheme: IconThemeData(color: pal.textMuted),
      ),
      cardTheme: CardThemeData(
        color: pal.glassFill,
        elevation: 0,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: pal.border),
        ),
        margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
      ),
      inputDecorationTheme: InputDecorationTheme(
        filled: true,
        fillColor: pal.inputFill,
        hintStyle: GoogleFonts.inter(
          color: pal.textFaint,
          fontWeight: FontWeight.w300,
        ),
        labelStyle: GoogleFonts.inter(
          color: pal.textDim,
          fontWeight: FontWeight.w400,
        ),
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: pal.border),
        ),
        enabledBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: pal.border),
        ),
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: pal.accent, width: 1.5),
        ),
        errorBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(14),
          borderSide: BorderSide(color: pal.error),
        ),
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      ),
      elevatedButtonTheme: ElevatedButtonThemeData(
        style: ElevatedButton.styleFrom(
          backgroundColor: EzoaColors.primary,
          foregroundColor: Colors.white,
          minimumSize: const Size.fromHeight(50),
          elevation: 0,
          shadowColor: EzoaColors.primary.withValues(alpha: 0.4),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: pal.accent,
          minimumSize: const Size.fromHeight(50),
          side: BorderSide(color: pal.borderStrong),
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w600,
            fontSize: 15,
          ),
        ),
      ),
      textButtonTheme: TextButtonThemeData(
        style: TextButton.styleFrom(
          foregroundColor: pal.accent,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w500),
        ),
      ),
      // Aligné sur EzoaGlassNavBar (capsule custom de 64 px) : sélection en
      // vert drapeau togolais, défaut noir, aucun violet/indigo.
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        indicatorColor: EzoaColors.primary.withValues(alpha: 0.14),
        elevation: 0,
        height: 64,
        labelTextStyle: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return GoogleFonts.inter(
              fontSize: 11,
              fontWeight: FontWeight.w600,
              color: EzoaColors.primary,
            );
          }
          return GoogleFonts.inter(
            fontSize: 11,
            fontWeight: FontWeight.w400,
            color: const Color(0xFF18181B),
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: EzoaColors.primary, size: 22);
          }
          return const IconThemeData(color: Color(0xFF18181B), size: 22);
        }),
      ),
      dividerTheme: DividerThemeData(color: pal.border),
      dialogTheme: DialogThemeData(
        backgroundColor: pal.dialogBg,
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(16),
          side: BorderSide(color: pal.border),
        ),
      ),
      snackBarTheme: SnackBarThemeData(
        backgroundColor: pal.dialogBg,
        contentTextStyle: GoogleFonts.inter(color: pal.textMuted),
        shape: RoundedRectangleBorder(
          borderRadius: BorderRadius.circular(12),
          side: BorderSide(color: pal.border),
        ),
        behavior: SnackBarBehavior.floating,
      ),
      progressIndicatorTheme: ProgressIndicatorThemeData(
        color: pal.accent,
        circularTrackColor: pal.progressTrack,
      ),
      switchTheme: SwitchThemeData(
        thumbColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) return EzoaColors.primary;
          return pal.textFaint;
        }),
        trackColor: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return EzoaColors.primary.withValues(alpha: 0.4);
          }
          return pal.progressTrack;
        }),
      ),
    );
  }
}
