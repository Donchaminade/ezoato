import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart' show rootBundle;

/// Documents légaux EZOA-TO (source unique partagée avec le web :
/// `src/content/legal.json`, copiée dans `assets/legal/legal.json`).
class LegalDoc {
  LegalDoc(this.slug, this.title, this.short, this.description, this.updated, this.sections);
  final String slug, title, short, description, updated;
  final List<LegalSectionData> sections;

  factory LegalDoc.fromJson(Map<String, dynamic> j) => LegalDoc(
        j['slug'] as String,
        j['title'] as String,
        j['short'] as String,
        j['description'] as String,
        j['updated'] as String,
        (j['sections'] as List)
            .map((s) => LegalSectionData(
                  s['title'] as String,
                  (s['blocks'] as List).map((b) => Map<String, dynamic>.from(b as Map)).toList(),
                ))
            .toList(),
      );
}

class LegalSectionData {
  LegalSectionData(this.title, this.blocks);
  final String title;
  final List<Map<String, dynamic>> blocks;
}

List<LegalDoc>? _cache;

Future<List<LegalDoc>> loadLegalDocs() async {
  if (_cache != null) return _cache!;
  final raw = await rootBundle.loadString('assets/legal/legal.json');
  _cache = (jsonDecode(raw) as List)
      .map((e) => LegalDoc.fromJson(Map<String, dynamic>.from(e as Map)))
      .toList();
  return _cache!;
}

const _icons = <String, IconData>{
  'cgu': Icons.gavel_rounded,
  'confidentialite': Icons.shield_outlined,
  'mentions-legales': Icons.info_outline_rounded,
  'conditions-de-vente': Icons.receipt_long_rounded,
  'charte-contributeurs': Icons.volunteer_activism_outlined,
  'cookies': Icons.cookie_outlined,
};

void openLegal(BuildContext context, [String? slug]) {
  Navigator.of(context, rootNavigator: true).push(MaterialPageRoute(
    builder: (_) => slug == null ? const LegalHubScreen() : LegalDocScreen(slug: slug),
  ));
}

class LegalHubScreen extends StatelessWidget {
  const LegalHubScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    return Scaffold(
      appBar: AppBar(title: const Text('À propos & légal')),
      body: FutureBuilder<List<LegalDoc>>(
        future: loadLegalDocs(),
        builder: (context, snap) {
          if (!snap.hasData) return const Center(child: CircularProgressIndicator());
          final docs = snap.data!;
          return ListView(
            padding: const EdgeInsets.fromLTRB(16, 8, 16, 32),
            children: [
              Padding(
                padding: const EdgeInsets.fromLTRB(4, 8, 4, 16),
                child: Text(
                  'EZOA-TO — Les documents qui encadrent ton utilisation de l’application.',
                  style: TextStyle(color: cs.onSurfaceVariant, height: 1.4),
                ),
              ),
              for (final d in docs)
                Card(
                  elevation: 0,
                  margin: const EdgeInsets.only(bottom: 10),
                  shape: RoundedRectangleBorder(
                    borderRadius: BorderRadius.circular(16),
                    side: BorderSide(color: cs.outlineVariant.withValues(alpha: 0.6)),
                  ),
                  child: ListTile(
                    key: Key('legal-${d.slug}'),
                    contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 6),
                    leading: CircleAvatar(
                      backgroundColor: cs.primary.withValues(alpha: 0.12),
                      foregroundColor: cs.primary,
                      child: Icon(_icons[d.slug] ?? Icons.description_outlined, size: 20),
                    ),
                    title: Text(d.title, style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text('Mise à jour : ${d.updated}'),
                    trailing: const Icon(Icons.chevron_right_rounded),
                    onTap: () => Navigator.of(context).push(
                      MaterialPageRoute(builder: (_) => LegalDocScreen(slug: d.slug)),
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

class LegalDocScreen extends StatelessWidget {
  const LegalDocScreen({super.key, required this.slug});
  final String slug;

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;
    final body = TextStyle(color: cs.onSurfaceVariant, height: 1.55, fontSize: 14.5);
    return FutureBuilder<List<LegalDoc>>(
      future: loadLegalDocs(),
      builder: (context, snap) {
        final doc = snap.data?.firstWhere((d) => d.slug == slug, orElse: () => snap.data!.first);
        return Scaffold(
          appBar: AppBar(title: Text(doc?.short ?? 'Légal')),
          body: doc == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.fromLTRB(20, 8, 20, 40),
                  children: [
                    Text(doc.title,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.w700)),
                    const SizedBox(height: 12),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                      decoration: BoxDecoration(
                        color: cs.primary.withValues(alpha: 0.08),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: Text('Dernière mise à jour : ${doc.updated}',
                          style: TextStyle(color: cs.primary, fontWeight: FontWeight.w600, fontSize: 13)),
                    ),
                    for (final s in doc.sections) ...[
                      const SizedBox(height: 24),
                      Text(s.title,
                          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.w700)),
                      const SizedBox(height: 8),
                      for (final b in s.blocks)
                        if (b['list'] != null)
                          for (final item in (b['list'] as List))
                            Padding(
                              padding: const EdgeInsets.only(bottom: 6, left: 4),
                              child: Row(crossAxisAlignment: CrossAxisAlignment.start, children: [
                                Padding(
                                  padding: const EdgeInsets.only(top: 8, right: 10),
                                  child: Container(
                                      width: 5, height: 5,
                                      decoration: BoxDecoration(color: cs.primary, shape: BoxShape.circle)),
                                ),
                                Expanded(child: Text(item as String, style: body)),
                              ]),
                            )
                        else
                          Padding(
                            padding: const EdgeInsets.only(bottom: 8),
                            child: Text(b['p'] as String, style: body),
                          ),
                    ],
                  ],
                ),
        );
      },
    );
  }
}
