import { Link, Stack } from 'expo-router';
import { StyleSheet, Text, View } from 'react-native';
import { Colors } from '@/lib/colors';

export default function NotFoundScreen() {
  return (
    <>
      <Stack.Screen options={{ title: 'Oeps!' }} />
      <View style={styles.container}>
        <Text style={styles.text}>Deze pagina bestaat niet.</Text>
        <Link href="/" style={styles.link}>
          <Text style={styles.linkText}>Ga terug naar het hoofdscherm!</Text>
        </Link>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    backgroundColor: Colors.background,
  },
  text: {
    fontSize: 20,
    fontFamily: 'Inter-Bold',
    color: Colors.textPrimary,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
  linkText: {
    fontFamily: 'Inter-Medium',
    color: Colors.primary,
    fontSize: 16,
  },
});
