import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, FlatList, Pressable, TextInput } from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function App() {

  const [listofDoctors, setlistofDoctors] = useState([]);
  const [loggedIn, setloggedIn] = useState(false);
  const [listofAppointment, setlisofAppointment] = useState([]);
  const [refresh, setRefresh] = useState(false);

  async function Load() {
    await axios("http://192.168.0.242:3000/doctorprofiles").then((result) => {
      setlistofDoctors(result.data);
    });
  }

  async function Bookappointment() {
    await axios("http://192.168.0.242:3000/appointments").then((result) => {
      const kirekhar = result.data.map(item => ({
        ...item,
        number: item.number == undefined ? 1 : item.number
      }));
      setlisofAppointment(kirekhar);
    });
  }

  function Login() {
    const nameset = !loggedIn;
    setloggedIn(nameset);
    if (nameset) {
      Bookappointment();
    }
  }

  useEffect(() => {
    if (listofDoctors.length == 0) {
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

  function Booking(appointment) {
    if (!appointment.név || appointment.név.trim() === "") {
      alert("Please enter your name before booking.");
    } else {
      alert("Your appointment Booked");
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>List of Doctors</Text>

      <Pressable  onPress={Login}>
        <Text style={{textAlign:'center'}}>{loggedIn ? "Kijelentkezés" : "Bejelentkezés"}</Text>
      </Pressable>

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
                      appointment.név = text;
                      setRefresh(!refresh);
                    }}
                  />

                  <Pressable style={styles.button} onPress={() => Booking(appointment)}>
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
