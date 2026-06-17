import 'package:flutter/foundation.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../../core/network/api_client.dart';
import '../../../core/network/connectivity_service.dart';
import '../../../shared/models/models.dart';

final archivesSearchProvider = StateProvider<String>((ref) => '');

@immutable
class PaginatedEpreuvesState {
  const PaginatedEpreuvesState({
    required this.items,
    required this.currentPage,
    required this.total,
    this.isLoadingMore = false,
    this.loadMoreError,
  });

  final List<Epreuve> items;
  final int currentPage;
  final int total;
  final bool isLoadingMore;
  final Object? loadMoreError;

  bool get hasMore => items.length < total;

  PaginatedEpreuvesState copyWith({
    List<Epreuve>? items,
    int? currentPage,
    int? total,
    bool? isLoadingMore,
    Object? loadMoreError,
    bool clearLoadMoreError = false,
  }) {
    return PaginatedEpreuvesState(
      items: items ?? this.items,
      currentPage: currentPage ?? this.currentPage,
      total: total ?? this.total,
      isLoadingMore: isLoadingMore ?? this.isLoadingMore,
      loadMoreError:
          clearLoadMoreError ? null : (loadMoreError ?? this.loadMoreError),
    );
  }
}

/// Liste paginée des épreuves Archives avec recherche.
///
/// - [ArchivesEpreuvesNotifier.perPage] : 20 items (10 rangées en grille 2 col.)
/// - [ArchivesEpreuvesNotifier.prefetchAhead] : 4 — déclenche le chargement à
///   l'index `length - 4` (16e item sur 20), soit ~2 rangées avant la fin pour
///   laisser le temps au réseau sans loader visible trop tôt.
class ArchivesEpreuvesNotifier
    extends AutoDisposeAsyncNotifier<PaginatedEpreuvesState> {
  static const perPage = 20;
  static const prefetchAhead = 4;

  @override
  Future<PaginatedEpreuvesState> build() async {
    if (!ref.watch(isOnlineProvider)) {
      return const PaginatedEpreuvesState(
        items: [],
        currentPage: 0,
        total: 0,
      );
    }
    ref.watch(archivesSearchProvider);
    return _fetchPage(1);
  }

  Future<PaginatedEpreuvesState> _fetchPage(int page) async {
    final q = ref.read(archivesSearchProvider);
    final result = await ref.read(apiClientProvider).listEpreuves(
          ListEpreuvesParams(
            q: q.isEmpty ? null : q,
            page: page,
            perPage: perPage,
          ),
        );
    return PaginatedEpreuvesState(
      items: result.items,
      currentPage: page,
      total: result.total,
    );
  }

  Future<void> refresh() async {
    state = const AsyncLoading();
    state = await AsyncValue.guard(() => _fetchPage(1));
  }

  Future<void> loadMore() async {
    final current = state.valueOrNull;
    if (current == null ||
        !current.hasMore ||
        current.isLoadingMore ||
        current.loadMoreError != null) {
      return;
    }

    state = AsyncData(
      current.copyWith(isLoadingMore: true, clearLoadMoreError: true),
    );

    try {
      final nextPage = current.currentPage + 1;
      final q = ref.read(archivesSearchProvider);
      final result = await ref.read(apiClientProvider).listEpreuves(
            ListEpreuvesParams(
              q: q.isEmpty ? null : q,
              page: nextPage,
              perPage: perPage,
            ),
          );
      final merged = [...current.items, ...result.items];
      state = AsyncData(
        PaginatedEpreuvesState(
          items: merged,
          currentPage: nextPage,
          total: result.total,
        ),
      );
    } catch (e) {
      state = AsyncData(
        current.copyWith(isLoadingMore: false, loadMoreError: e),
      );
    }
  }

  Future<void> retryLoadMore() async {
    final current = state.valueOrNull;
    if (current == null || current.loadMoreError == null) return;
    state = AsyncData(current.copyWith(clearLoadMoreError: true));
    await loadMore();
  }

  void maybePrefetch(int index) {
    final current = state.valueOrNull;
    if (current == null || current.items.isEmpty) return;
    if (index < current.items.length - prefetchAhead) return;
    loadMore();
  }
}

final archivesEpreuvesProvider = AutoDisposeAsyncNotifierProvider<
    ArchivesEpreuvesNotifier, PaginatedEpreuvesState>(
  ArchivesEpreuvesNotifier.new,
);
