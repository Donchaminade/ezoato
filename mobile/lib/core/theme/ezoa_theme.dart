import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

/// Constantes de marque (identiques dans les deux modes) + accès à la
/// palette résolue selon la brightness courante via [EzoaColors.of].
///
/// Charte soft / épurée : émeraude #006A4E, or #FFCE00 en micro-accent,
/// fonds off-white ou charcoal doux — pas d’indigo / violet AI.
class EzoaColors {
  // Brand
  static const primary = Color(0xFF006A4E);
  static const primaryDark = Color(0xFF004D38);
  static const accent = Color(0xFF2D8A6E); // émeraude lisible (liens, focus)
  static const accentBlue = Color(0xFF2D8A6E); // alias rétrocompat → émeraude
  static const emerald = Color(0xFF34D399);
  static const gold = Color(0xFFFFCE00);
  static const error = Color(0xFFF87171);

  // Surfaces sombres soft (charcoal, pas noir pur)
  static const zinc950 = Color(0xFF121816);
  static const cobaltNight = Color(0xFF1A2220);
  static const cobaltDeep = Color(0xFF161C1A);
  static const zinc300 = Color(0xFFD4D4D8);
  static const zinc400 = Color(0xFFA1A1AA);
  static const zinc500 = Color(0xFF71717A);

  /// Palette adaptée à la brightness du thème courant.
  static EzoaPalette of(BuildContext context) => EzoaPalette.of(context);
}

/// Palette résolue selon la brightness : soft editorial, surfaces plates,
/// ombres légères — héritage glass allégé.
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

  /// Mode sombre soft : charcoal verdâtre, surfaces mates, peu de shine.
  static const dark = EzoaPalette(
    brightness: Brightness.dark,
    text: Color(0xFFF4F4F5),
    textMuted: Color(0xFFD4D4D8),
    textDim: Color(0xFFA1A1AA),
    textFaint: Color(0xFF71717A),
    accent: EzoaColors.emerald,
    emerald: EzoaColors.emerald,
    gold: EzoaColors.gold,
    error: EzoaColors.error,
    background: EzoaColors.zinc950,
    surfaceSolid: Color(0xFF1A2220),
    border: Color(0x14FFFFFF),
    borderStrong: Color(0x1FFFFFFF),
    glassFill: Color(0xE61A2220),
    glassSheenTop: Color(0xE61A2220),
    glassSheenBottom: Color(0xD9161C1A),
    subtleFill: Color(0x0DFFFFFF),
    inputFill: Color(0x14FFFFFF),
    shadow: Color(0x33000000),
    shadowStrong: Color(0x40000000),
    capsuleFill: Color(0xE6FFFFFF),
    navBarFill: Color(0xE61A2220),
    appBarFillTop: Color(0xF2121816),
    appBarFillBottom: Color(0xCC121816),
    dialogBg: Color(0xFF1A2220),
    offlineFill: Color(0xD93F3F46),
    offlineText: EzoaColors.zinc300,
    gridLine: Color(0x06FFFFFF),
    curveLine: Color(0x08FFFFFF),
    progressTrack: Color(0x1AFFFFFF),
    shineStrong: Color(0x0DFFFFFF),
    shineSoft: Color(0x05FFFFFF),
    gradientStops: [
      EzoaColors.zinc950,
      EzoaColors.cobaltDeep,
      Color(0xFF1A2220),
      EzoaColors.cobaltDeep,
      EzoaColors.zinc950,
    ],
  );

  /// Mode clair : off-white #FAFAFA, CTAs émeraude, or en micro-accent.
  static const light = EzoaPalette(
    brightness: Brightness.light,
    text: Color(0xFF18181B),
    textMuted: Color(0xFF3F3F46),
    textDim: Color(0xFF71717A),
    textFaint: Color(0xFFA1A1AA),
    accent: EzoaColors.primary,
    emerald: Color(0xFF059669),
    gold: Color(0xFFB45309),
    error: Color(0xFFDC2626),
    background: Color(0xFFFAFAFA),
    surfaceSolid: Colors.white,
    border: Color(0x12000000),
    borderStrong: Color(0x1A000000),
    glassFill: Color(0xF2FFFFFF),
    glassSheenTop: Color(0xFAFFFFFF),
    glassSheenBottom: Color(0xF2FFFFFF),
    subtleFill: Color(0x08000000),
    inputFill: Color(0x0A000000),
    shadow: Color(0x0F0F172A),
    shadowStrong: Color(0x180F172A),
    capsuleFill: Color(0xF2FFFFFF),
    navBarFill: Color(0xF2FFFFFF),
    appBarFillTop: Color(0xFAFFFFFF),
    appBarFillBottom: Color(0xE6FFFFFF),
    dialogBg: Colors.white,
    offlineFill: Color(0xEBE4E4E7),
    offlineText: Color(0xFF3F3F46),
    gridLine: Color(0x07000000),
    curveLine: Color(0x0A000000),
    progressTrack: Color(0x14000000),
    shineStrong: Color(0x33FFFFFF),
    shineSoft: Color(0x14FFFFFF),
    gradientStops: [
      Color(0xFFFAFAFA),
      Color(0xFFF5F7F6),
      Color(0xFFEEF5F2),
      Color(0xFFF5F7F6),
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
        height: 1.25,
      );

  static TextStyle titleMedium(BuildContext context) => GoogleFonts.spaceGrotesk(
        fontSize: 18,
        fontWeight: FontWeight.w700,
        color: EzoaColors.of(context).text,
        height: 1.3,
      );

  static TextStyle titleSmall(BuildContext context) => GoogleFonts.spaceGrotesk(
        fontSize: 16,
        fontWeight: FontWeight.w700,
        color: EzoaColors.of(context).text,
      );

  static TextStyle body(BuildContext context) => GoogleFonts.inter(
        fontSize: 15,
        fontWeight: FontWeight.w400,
        color: EzoaColors.of(context).textMuted,
        height: 1.5,
      );

  static TextStyle bodySmall(BuildContext context) => GoogleFonts.inter(
        fontSize: 13,
        fontWeight: FontWeight.w400,
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
            secondary: EzoaColors.gold,
            surface: pal.surfaceSolid,
            error: pal.error,
            onPrimary: Colors.white,
            onSurface: pal.text,
          )
        : ColorScheme.light(
            primary: EzoaColors.primary,
            secondary: EzoaColors.gold,
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
          fontWeight: FontWeight.w400,
          color: pal.textMuted,
        ),
        bodyMedium: bodyFont.bodyMedium?.copyWith(
          fontWeight: FontWeight.w400,
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
          fontWeight: FontWeight.w400,
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
          borderSide: const BorderSide(color: EzoaColors.primary, width: 1.5),
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
          shadowColor: Colors.transparent,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
          textStyle: GoogleFonts.spaceGrotesk(
            fontWeight: FontWeight.w700,
            fontSize: 15,
          ),
        ),
      ),
      outlinedButtonTheme: OutlinedButtonThemeData(
        style: OutlinedButton.styleFrom(
          foregroundColor: EzoaColors.primary,
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
          foregroundColor: EzoaColors.primary,
          textStyle: GoogleFonts.inter(fontWeight: FontWeight.w500),
        ),
      ),
      // Aligné sur EzoaGlassNavBar : sélection émeraude, défaut zinc.
      navigationBarTheme: NavigationBarThemeData(
        backgroundColor: Colors.transparent,
        indicatorColor: EzoaColors.primary.withValues(alpha: 0.12),
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
            color: pal.textDim,
          );
        }),
        iconTheme: WidgetStateProperty.resolveWith((states) {
          if (states.contains(WidgetState.selected)) {
            return const IconThemeData(color: EzoaColors.primary, size: 22);
          }
          return IconThemeData(color: pal.textDim, size: 22);
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
        color: EzoaColors.primary,
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
