import { StatusBar } from 'expo-status-bar';
import { StyleSheet, Text, View, Image, FlatList, Pressable, TextInput, ImageBackground } from 'react-native'
import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import DatePicker from 'react-native-date-picker'; //not supporting Datepicker
import { Picker } from '@react-native-picker/picker';

const Stack = createNativeStackNavigator()


function generateTimeSlots() {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const h = hour.toString().padStart(2, '0')
      const m = min.toString().padStart(2, '0')
      slots.push(`${h}:${m}`)
    }
  }
  return slots;
}

function DoctorScreen({ navigation }) {
  const [listOfDoctors, setlistOfDoctors] = useState([])
  const [refresh, setRefresh] = useState(false);
  const [appointments, setAppointments] = useState([])

async function Load() {
  try {
    const result = await axios.get("http://192.168.0.242:3000/doctorprofiles")
    const doctors = result.data;

   
    const doctorsWithSlots = await Promise.all(doctors.map(async (doc) => {
      
      const slotsResponse = await axios.get(`http://192.168.0.242:3000/shifts/${doc.id}/timeslots`);
      return {
        ...doc,
        timeslots: slotsResponse.data,
        number: 1
      }
    }))

    setlistOfDoctors(doctorsWithSlots);

    setAppointments(doctorsWithSlots.map(doctor => ({
      name: '',
      username: '',
      email: '',
      date: new Date(),
      timeslotId: doctor.timeslots.length > 0 ? doctor.timeslots[0].id : null
    })));
  } catch (error) {
    console.error("Error loading doctors or timeslots:", error);
  }
}

  async function ConfirmRegistration(index, doctor) {
    const appointment = appointments[index];
    if(!appointment.name || !appointment.username || !appointment.email){

      alert("please fill in all fields")
      return
    }
    const payload = {
      név: appointment.name,
      megjegyzés: `${appointment.username} | ${appointment.email}`,
      timeslotId: appointment.timeslotId
    };
    try {
      let all = await AsyncStorage.getItem("appointments")
      let current = all ? JSON.parse(all) : []
      current.push({ doctor: doctor.Docname, ...appointment })
      await AsyncStorage.setItem("appointments", JSON.stringify(current))
      alert("Registration saved successfully.");
    } catch (err) {
      console.log("AsyncStorage error:", err)
    }
  }

  useEffect(() => {
    if (listOfDoctors.length === 0) Load();
  }, [listOfDoctors]);

  function AppIncrease(item) {
    const index = listOfDoctors.indexOf(item);
    if (listOfDoctors[index].number < 10) {
      listOfDoctors[index].number++;
      setRefresh(!refresh);
    }
  }

  function AppDecrease(item) {
    const index = listOfDoctors.indexOf(item);
    if (listOfDoctors[index].number - 1 > 0) {
      listOfDoctors[index].number--;
      setRefresh(!refresh);
    }
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Doctor Appointment</Text>
      <Pressable onPress={() => navigation.navigate("Admin")}>
        <Text style={{ color: 'blue', marginBottom: 20 }}>Go to Admin Page</Text>
      </Pressable>

      <FlatList
        data={listOfDoctors}
        keyExtractor={(item, index) => item.Docname?.toString() || index.toString()}
        renderItem={({ item, index }) => {
          const appointment = appointments[index];
          return (
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Image source={{ uri: item.profilKépUrl }} style={{ width: 80, height: 130, borderRadius: 12, borderColor: "lime", borderWidth: 2 }} />
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                  <Text style={{ fontWeight: "bold" }}>{item.Docname}</Text>
                  <Text style={{ fontWeight: "bold" }}>Description:</Text>
                  <Text>{item.description}</Text>
                  <Text style={{ fontWeight: "bold" }}>Speciality:</Text>
                  <Text>{item.specialty}</Text>
                  <Text style={{ fontWeight: "bold" }}>Treatment:</Text>
                  <Text>{item.treatments}</Text>
                </View>
              </View>

              <View style={{ flexDirection: "row", justifyContent: "space-between", marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{fontSize:15, marginTop:40,fontWeight:"bold",paddingVertical:10}}>Patient Registration</Text>
                  <TextInput placeholder="Name" value={appointment.name} style={styles.input} onChangeText={(text) => {
                    const updated = [...appointments];
                    updated[index].name = text;
                    setAppointments(updated);
                  }} />

                  <TextInput placeholder="Username" value={appointment.username} style={styles.input} onChangeText={(text) => {
                    const updated = [...appointments];
                    updated[index].username = text;
                    setAppointments(updated);
                  }} />

                  <TextInput placeholder="Email" value={appointment.email} style={styles.input} onChangeText={(text) => {
                    const updated = [...appointments];
                    updated[index].email = text;
                    setAppointments(updated);
                  }} />

                  <DatePicker
                    date={appointment.date}
                    onDateChange={(date) => {
                      const updated = [...appointments];
                      updated[index].date = date;
                      setAppointments(updated);
                    }}
                    mode="date"
                  />
                </View>

                <View style={{ flex: 1, alignItems: 'flex-end' }}>
                  <Text style={{textAlign:"center",fontWeight:"bold",marginTop:15,paddingVertical:10}}>Consultation Time</Text>
                  <Picker
                    selectedValue={appointment.timeslotId}
                    style={{ height: 50, width: 140, borderRadius:10 }}
                    onValueChange={(value) => {
                      const updated = [...appointments];
                      updated[index].timeslot = value;
                      setAppointments(updated);
                    }}
                  >
                    {generateTimeSlots().map((slot, idx) => (
                    <Picker.Item key={slot.id} label={`${slot.kezdes} - ${slot.veg}`} value={slot.id} />
                    ))}
                  </Picker>

                  <Pressable onPress={() => ConfirmRegistration(index, item)}>
                    <Text style={styles.button}>Confirm Registration</Text>
                  </Pressable>

                  <Text style={{ marginTop: 5,textAlign:"center" }}>Number of Patient</Text>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Pressable onPress={() => AppIncrease(item)}><Text style={{ fontSize: 25,borderColor:"gray",borderWidth:4,borderRadius:15,padding:10,marginTop:12 }}>+</Text></Pressable>
                    <Text style={{ marginHorizontal: 10 }}>{item.number}</Text>
                    <Pressable onPress={() => AppDecrease(item)}><Text style={{ fontSize: 25,borderColor:"gray",borderWidth:4,borderRadius:15,padding:10,marginTop:12}}>-</Text></Pressable>
                  </View>
                </View>
              </View>
            </View>
          )
        }}
      />
    </View>
  );
}


function AdminScreen() {
  const [appointments, setAppointments] = useState([])
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loggedIn, setLoggedIn] = useState(false)

  async function loadAppointments() {
    const raw = await AsyncStorage.getItem("appointments")
    if (raw) {
      setAppointments(JSON.parse(raw))
    }
  }

  async function deleteAppointment(index) {
    const copy = [...appointments]
    copy.splice(index, 1)
    await AsyncStorage.setItem("appointments", JSON.stringify(copy));
    setAppointments(copy);
  }

  function handleLogin() {
    if (email === 'admin@admin.com' && password === 'admin123qwe') {
      setLoggedIn(true)
      loadAppointments()
    } else {
      alert("Wrong credentials")
    }
  }

  if (!loggedIn) {
    return (
      <View style={styles.container}>
        <TextInput placeholder="Admin Email" value={email} onChangeText={setEmail} style={styles.input} />
        <TextInput placeholder="Password" value={password} onChangeText={setPassword} secureTextEntry style={styles.input} />
        <Pressable onPress={handleLogin}><Text style={styles.button}>Login</Text></Pressable>
        <Text style={{textAlign:"center", borderWidth:4,borderColor:'blue', marginTop:25,padding:10, alignItems:'center',justifyContent:'flex-end'}}>FYI Admin email is admin@admin.com & Password admin123qwe</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.heading}>Appointments</Text>
      {appointments.map((app, index) => (
        <View key={index} style={{ marginBottom: 10 }}>
          <Text>Doctor: {app.doctor}</Text>
          <Text>Patient: {app.name}</Text>
          <Text>Username: {app.username}</Text>
          <Text>Email: {app.email}</Text>
          <Text>Date: {new Date(app.date).toLocaleDateString()}</Text>
          <Text>Time: {app.timeslot}</Text>
          <Pressable onPress={() => deleteAppointment(index)}>
            <Text style={{ color: 'red' }}>Delete</Text>
          </Pressable>
        </View>
      ))}
    </View>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Doctor">
        <Stack.Screen name="Doctor" component={DoctorScreen} />
        <Stack.Screen name="Admin" component={AdminScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingTop: 40,
    paddingHorizontal: 10
  },
  heading: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center"
  },
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: '90%',
    backgroundColor: '#f4f4f4',
    textAlign: 'center',
    alignItems:"center",
    justifyContent:"center",
    width:160,
   paddingHorizontal:20
  },
  button: {
    color: 'blue',
    borderColor: 'blue',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
      alignItems:"center",
    justifyContent:"center",
    width:160
  }
})
