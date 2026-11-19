import { StatusBar } from 'expo-status-bar';
import { Alert, Image, Pressable, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={{ flex: 1, backgroundColor: '#EAF1E4', justifyContent: 'center', padding: 20 }}>
      <View
        style={{
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#DCE6D2',
          borderRadius: 16,
          overflow: 'hidden',
        }}
      >
        <Image source={require('./assets/farm.webp')} style={{ width: '100%', height: 140 }} />
        <View style={{ padding: 16 }}>
          <Text style={{ fontSize: 18, fontWeight: '600', color: '#1C211B' }}>Tomato</Text>
          <Text style={{ fontSize: 13, color: '#5B6158', marginTop: 2 }}>Mani · 120 kg available</Text>
          <Text style={{ fontSize: 15, fontWeight: '600', color: '#1C211B', marginTop: 8 }}>₹48 / kg</Text>
          <Pressable
            onPress={() => Alert.alert('Added', 'Tomato added to cart')}
            style={{
              height: 44,
              marginTop: 12,
              backgroundColor: '#1E4D2B',
              borderRadius: 8,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#FFFFFF', fontSize: 14, fontWeight: '500' }}>Add to cart</Text>
          </Pressable>
        </View>
      </View>
      <StatusBar style="auto" />
    </View>
  );
}
