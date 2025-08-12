// ignore_for_file: unused_field

import 'dart:math';

import 'package:shared_preferences/shared_preferences.dart';

class SmolHog {
  static SmolHog? _instance;
  static SmolHog get instance => _instance!;

  final String _apiKey;
  final String _host;
  String? _userId;
  String? _sessionId;
  final List<Map<String, dynamic>> _eventQueue = [];

  SmolHog._internal(this._apiKey, this._host);

  static Future<void> initialize({
    required String apiKey,
    required String host,
  }) async {
    _instance = SmolHog._internal(apiKey, host);
    await _instance!._setup();
  }

  Future<void> _setup() async {
    final prefs = await SharedPreferences.getInstance();

    _userId = prefs.getString('smolhog_user_id');
    if (_userId == null) {
      _userId = _generateId();
      await prefs.setString('smolhog_user_id', _userId!);
    }
    _sessionId = _generateId();
  }

  String _generateId() {
    final random = Random();
    return '${DateTime.now().millisecondsSinceEpoch}-${random.nextInt(99999)}';
  }
}
