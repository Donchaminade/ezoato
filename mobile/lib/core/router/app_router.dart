import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';

import '../../features/account/presentation/abonnement_screen.dart';
import '../../features/account/presentation/account_shell_screen.dart';
import '../../features/account/presentation/bibliotheque_screen.dart';
import '../../features/account/presentation/downloads_screen.dart';
import '../../features/account/presentation/notifications_screen.dart';
import '../../features/account/presentation/paiements_screen.dart';
import '../../features/account/presentation/portefeuille_screen.dart';
import '../../features/account/presentation/profile_screen.dart';
import '../../features/account/presentation/soumission_detail_screen.dart';
import '../../features/account/presentation/soumissions_screen.dart';
import '../../features/auth/data/auth_repository.dart';
import '../../features/auth/presentation/login_screen.dart';
import '../../features/auth/presentation/register_screen.dart';
import '../../features/auth/presentation/splash_screen.dart';
import '../../features/epreuves/presentation/archives_screen.dart';
import '../../features/epreuves/presentation/epreuve_detail_screen.dart';
import '../../features/epreuves/presentation/home_screen.dart';
import '../../features/epreuves/presentation/main_shell_screen.dart';
import '../../features/favorites/presentation/favoris_screen.dart';
import '../../features/offline/presentation/offline_library_screen.dart';
import '../../features/submit/presentation/submit_screen.dart';

final _rootNavigatorKey = GlobalKey<NavigatorState>();
final _shellNavigatorHomeKey = GlobalKey<NavigatorState>(debugLabel: 'home');
final _shellNavigatorArchivesKey = GlobalKey<NavigatorState>(debugLabel: 'archives');
final _shellNavigatorSubmitKey = GlobalKey<NavigatorState>(debugLabel: 'submit');
final _shellNavigatorFavorisKey = GlobalKey<NavigatorState>(debugLabel: 'favoris');
final _shellNavigatorAccountKey = GlobalKey<NavigatorState>(debugLabel: 'account');

final routerProvider = Provider<GoRouter>((ref) {
  final auth = ref.watch(authProvider);

  return GoRouter(
    navigatorKey: _rootNavigatorKey,
    initialLocation: '/',
    redirect: (context, state) {
      final isLoading = auth.isLoading;
      final isAuth = auth.isAuthenticated;
      final path = state.matchedLocation;
      final isSplash = path == '/';
      final isAuthRoute = path == '/login' || path == '/register';

      if (isLoading) return isSplash ? null : '/';
      if (!isAuth && !isAuthRoute && !isSplash) return '/login';
      if (isAuth && isAuthRoute) return '/home';
      return null;
    },
    routes: [
      GoRoute(path: '/', builder: (_, __) => const SplashScreen()),
      GoRoute(path: '/login', builder: (_, __) => const LoginScreen()),
      GoRoute(path: '/register', builder: (_, __) => const RegisterScreen()),
      StatefulShellRoute.indexedStack(
        builder: (context, state, navigationShell) {
          return MainShellScreen(navigationShell: navigationShell);
        },
        branches: [
          StatefulShellBranch(
            navigatorKey: _shellNavigatorHomeKey,
            routes: [
              GoRoute(path: '/home', builder: (_, __) => const HomeScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorArchivesKey,
            routes: [
              GoRoute(path: '/archives', builder: (_, __) => const ArchivesScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorSubmitKey,
            routes: [
              GoRoute(path: '/submit', builder: (_, __) => const SubmitScreen()),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorFavorisKey,
            routes: [
              GoRoute(
                path: '/favoris',
                builder: (_, __) => const FavorisScreen(asTab: true),
              ),
            ],
          ),
          StatefulShellBranch(
            navigatorKey: _shellNavigatorAccountKey,
            routes: [
              GoRoute(path: '/account', builder: (_, __) => const AccountMenuScreen()),
            ],
          ),
        ],
      ),
      GoRoute(
        path: '/epreuve/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) => EpreuveDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/account/profile',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const ProfileScreen(),
      ),
      GoRoute(
        path: '/account/favoris',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const FavorisScreen(),
      ),
      GoRoute(
        path: '/account/bibliotheque',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const BibliothequeScreen(),
      ),
      GoRoute(
        path: '/account/offline',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const OfflineLibraryScreen(),
      ),
      GoRoute(
        path: '/account/portefeuille',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const PortefeuilleScreen(),
      ),
      GoRoute(
        path: '/account/soumissions',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const SoumissionsScreen(),
      ),
      GoRoute(
        path: '/account/soumissions/:id',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, state) =>
            SoumissionDetailScreen(id: state.pathParameters['id']!),
      ),
      GoRoute(
        path: '/account/paiements',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const PaiementsScreen(),
      ),
      GoRoute(
        path: '/account/downloads',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const DownloadsScreen(),
      ),
      GoRoute(
        path: '/account/abonnement',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const AbonnementScreen(),
      ),
      GoRoute(
        path: '/account/notifications',
        parentNavigatorKey: _rootNavigatorKey,
        builder: (_, __) => const NotificationsScreen(),
      ),
    ],
  );
});
