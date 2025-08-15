import 'package:flutter/material.dart';
import 'package:smolhog_flutter/smolhog_flutter.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await SmolHog.initialize(
    apiKey: 'smolhog-ding-dong',
    host: 'http://localhost:3001',
  );

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'My App',
      home: AnalyticsScreen(screenName: 'home', child: HomePage()),
    );
  }
}

class HomePage extends StatelessWidget {
  const HomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text('Home')),
      body: Center(
        child: ElevatedButton(
          onPressed: () {
            SmolHog.instance.track(
              'button_clicked',
              properties: {'button_type': 'cta', 'screen': 'home'},
            );
          },
          child: Text('Track Event'),
        ),
      ),
    );
  }
}
