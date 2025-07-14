import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, FlatList, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function App() {

  const [listofDoctors, setlistofDoctors] = useState([]);
  const [loggedIn, setloggedIn] = useState(false);
  const [listofAppointment, setlisofAppointment] = useState([]);
  const [refresh, setRefresh] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState('');

  useEffect(() => {
    async function Loadinofr() {
      const Savetoken = await AsyncStorage.getItem('token');
      if (Savetoken) {
        setToken(Savetoken);
        setloggedIn(true);
        Bookappointment();
      }
    }
    Loadinofr();
  }, []);

  async function loginServer() {
    try {
      const res = await axios.post("http://192.168.0.242:3000/auth/login", {
        loginUsername: 'admin',
        loginPassword: '1234'
      });

      await AsyncStorage.setItem('token', res.data.token);
      setToken(res.data.token);
      setloggedIn(true);
      Bookappointment();
    } catch (error) {
      console.error(error);
      alert("Login failed");
    }
  }

  async function Load() {
    const result = await axios.get("http://192.168.0.242:3000/doctorprofiles");
    setlistofDoctors(result.data);
  }

  async function Bookappointment() {
    const result = await axios.get("http://192.168.0.242:3000/appointments");
    const kirekhar = result.data.map(item => ({
      ...item,
      number: item.number === undefined ? 1 : item.number
    }));
    setlisofAppointment(kirekhar);
  }

  function Login() {
    const nameset = !loggedIn;
    setloggedIn(nameset);
    if (nameset) {
      Bookappointment();
    }
  }

  useEffect(() => {
    if (listofDoctors.length === 0) {
      Load();
    }
  }, [listofDoctors]);

  function Appdecrease(item) {
    const index = listofAppointment.indexOf(item);
    if (listofAppointment[index].number - 1 > 0) {
      listofAppointment[index].number--;
      setRefresh(!refresh);
    }
  }

  function AppIncrease(item) {
    const index = listofAppointment.indexOf(item);
    if (listofAppointment[index].number < 10) {
      listofAppointment[index].number++;
      setRefresh(!refresh);
    }
  }

  async function Booking(appointment, doctor) {
    if (!appointment.név || appointment.név.trim() === "") {
      alert("Please enter your name before booking.");
      return;
    }

    try {
      await axios.post("http://192.168.0.242:3000/appointments", { 
        date: new Date(),
        doctorId: doctor.userId,
        patientname: appointment.név
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      alert("Your appointment is booked!");
    } catch (error) {
      alert("Failed to book appointment");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>List of Doctors</Text>

      <Pressable onPress={Login}>
        <Text style={{ textAlign: 'center' }}>{loggedIn ? "Kijelentkezés" : "Bejelentkezés"}</Text>
      </Pressable>

      {!loggedIn && (
       <View style={{ alignItems: "center", justifyContent: "center", marginTop: 50 }}>
  <TextInput
    style={{
      textAlign: "center",
      marginTop: 20,
      width: 200,
      height: 40,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      paddingHorizontal: 10,
    }}
    placeholder="Username"
    onChangeText={setUsername}
    value={username}
  />

  <TextInput
    style={{
      textAlign: "center",
      marginTop: 20,
      width: 200,
      height: 40,
      borderWidth: 1,
      borderColor: "#ccc",
      borderRadius: 5,
      paddingHorizontal: 10,
    }}
    placeholder="Password"
    secureTextEntry
    onChangeText={setPassword}
    value={password}
  />

  <Pressable onPress={loginServer} style={{ marginTop: 20 }}>
    <Text style={{ textAlign: "center", color: "blue" }}>Login</Text>
  </Pressable>
</View>

      )}

      <FlatList
        data={listofDoctors}
        keyExtractor={(item, index) => item.Docname ? item.Docname.toString() : index.toString()}
        extraData={refresh}
        renderItem={({ item, index }) => {
          const appointment = listofAppointment[index];

          return (
            <View style={styles.inline}>
              <View style={styles.leftSide}>
                <Image
                  style={styles.image}
                  source={{ uri: item.profilKépUrl }}
                />
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                  <Text>{item.Docname}</Text>
                  <Text style={styles.sp}>{item.specialty}</Text>
                  <Text>{item.description}</Text>
                  <Text>{item.treatments}</Text>
                </View>
              </View>

              {loggedIn && appointment && (
                <View style={styles.rightSide}>
                  <TextInput
                    style={styles.nev}
                    placeholder='Please enter your name'
                    onChangeText={(text) => {
                      const updatedappointment = [...listofAppointment];
                      updatedappointment[index] = {
                        ...updatedappointment[index],
                        név: text
                      };
                      setlisofAppointment(updatedappointment);
                    }}
                    value={appointment.név || ""}
                  />

                  <Pressable style={styles.button} onPress={() => Booking(appointment, item)}>
                    <Text>Booking Appointment</Text>
                  </Pressable>

                  <View style={styles.counterContainer}>
                    <Text>Number of Patient</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Pressable onPress={() => AppIncrease(appointment)} style={styles.counterButton}>
                        <Text style={styles.counterText}>+</Text>
                      </Pressable>
                      <Text style={styles.number}>{appointment.number}</Text>
                      <Pressable onPress={() => Appdecrease(appointment)} style={styles.counterButton}>
                        <Text style={styles.counterText}>-</Text>
                      </Pressable>
                    </View>
                  </View>
                </View>
              )}
            </View>
          );
        }}
      />

      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 10,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    color: "brown",
    textShadowColor: 'blue',
    textShadowRadius: 1,
    textShadowOffset: { width: 1, height: 1 },
    marginBottom: 15,
    textAlign: 'center',
  },
  inline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 10,
    borderBottomColor: '#ddd',
    borderBottomWidth: 1,
    alignItems: 'flex-start',
  },
  leftSide: {
    flexDirection: 'row',
    flex: 1,
    alignItems: 'flex-start',
  },
  rightSide: {
    width: 180,
    justifyContent: 'flex-start',
  },
  image: {
    width: 120,
    height: 160,
    borderRadius: 15,
    borderColor: 'black',
    borderWidth: 2,
  },
  sp: {
    fontWeight: "bold",
  },
  nev: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 5,
    borderRadius: 5,
    marginBottom: 10,
  },
  button: {
    backgroundColor: 'lime',
    alignItems: "center",
    borderWidth: 2,
    borderColor: "blue",
    paddingVertical: 10,
    borderRadius: 10,
    marginBottom: 10,
  },
  counterContainer: {
    alignItems: 'center',
  },
  counterButton: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    backgroundColor: '#ddd',
    marginHorizontal: 5,
    borderRadius: 5,
  },
  counterText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  number: {
    fontSize: 18,
    fontWeight: 'bold',
    minWidth: 30,
    textAlign: 'center',
  }
});
