import 'dart:convert';
import 'dart:developer' as dev;
import 'dart:math';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
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

  Future<void> track(
    String eventName, {
    Map<String, dynamic>? properties,
  }) async {
    if (_userId == null) return;
    final event = {
      'event_id': _generateId(),
      'event_name': eventName,
      'user_id': _userId!,
      'properties': properties ?? {},
      'timestamp': DateTime.now().toUtc().toIso8601String(),
      'session_id': _sessionId,
    };

    _eventQueue.add(event);
    await _sendEvents();
  }

  Future<void> _sendEvents() async {
    if (_eventQueue.isEmpty) return;
    final events = List<Map<String, dynamic>>.from(_eventQueue);
    _eventQueue.clear();

    try {
      final response = await http.post(
        Uri.parse('$_host/events'),
        headers: {'Content-Type': 'application/json', 'smolhog-api-key': _apiKey},
        body: jsonEncode({'events': events}),
      );

      if (response.statusCode != 200) {
        _eventQueue.addAll(events);
        dev.log('Failed to send events: ${response.statusCode}');
      }
    } catch (e) {
      _eventQueue.addAll(events);
      dev.log('Error sending events: $e');
    }
  }
}

class AnalyticsScreen extends StatefulWidget {
  final Widget child;
  final String screenName;

  const AnalyticsScreen({
    super.key,
    required this.child,
    required this.screenName,
  });

  @override
  // ignore: library_private_types_in_public_api
  _AnalyticsScreenState createState() => _AnalyticsScreenState();
}

class _AnalyticsScreenState extends State<AnalyticsScreen> {
  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      SmolHog.instance.track(
        'screen_view',
        properties: {'screen_name': widget.screenName},
      );
    });
  }

  @override
  Widget build(BuildContext context) => widget.child;
}
