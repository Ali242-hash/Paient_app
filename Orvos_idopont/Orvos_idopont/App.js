import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Image,
  FlatList, Pressable, TextInput
} from 'react-native';
import { useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';

import { ImageBackground } from 'react-native'


const Stack = createNativeStackNavigator();

function Generate_TimeSlot() {
  const slots = [];
  for (let hour = 9; hour < 17; hour++) {
    for (let min = 0; min < 60; min += 15) {
      const h = hour.toString().padStart(2, '0');
      const m = min.toString().padStart(2, '0');
      slots.push(`${h}:${m}`);
    }
  }
  return slots;
}

function DoctorScreen({ navigation }) {
  const [listofDoctors, SetlistofDcotros] = useState([]);
  const [listofAppointments, SetlistofAppointments] = useState([]);
  const [refresh, setRefresh] = useState(false);

  async function Load() {
    try {
      const { data: doctors } = await axios.get("http://192.168.0.242:3000/doctorprofiles");
      const doctorswithslots = await Promise.all(
        doctors.map(async (doc) => {
          const { data: slotid } = await axios.get(`http://192.168.0.242:3000/Shifts/${doc.id}/timeslots`);
          return {
            ...doc,
            timesslot: slotid,
            number: 1
          };
        })
      );
      SetlistofDcotros(doctorswithslots);
      SetlistofAppointments(
        doctorswithslots.map((doc) => ({
          name: "",
          username: "",
          email: "",
          date: new Date(),
          timeslot: doc.timesslot.length > 0 ? doc.timesslot[0].id : null
        }))
      );
    } catch (error) {
      console.log("Error loading doctors:", error);
    }
  }

async function Confirm_Registration(index, user) {
  const appointments = listofAppointments[index];

  if (!appointments.name || !appointments.username || !appointments.email) {
    alert("Please fill in the necessary details");
    return;
  }

  try {
    let all = await AsyncStorage.getItem("appointments");
    let current = all ? JSON.parse(all) : [];

    const isDuplicate = current.some(
      (a) => a.username === user.username && a.timeslot === user.timeslot
    );
    if (isDuplicate) {
      alert("This patient already has an appointment at this time");
      return;
    }

    current.push({
      ...appointments,
      doctor: user.Docname,
      email:user.email,
  username:user.username,
    });

    await AsyncStorage.setItem("appointments", JSON.stringify(current));
    alert("Registration confirmed");
  } catch (error) {
    console.log("Registration failed:", error);
  }
}



  useEffect(() => {
    if (listofDoctors.length === 0) {
      Load();
    }
  }, [listofDoctors]);

  function AppIncrease(item) {
    const index = listofDoctors.indexOf(item);
    if (listofDoctors[index].number < 10) {
      listofDoctors[index].number++;
      setRefresh(!refresh);
    }
  }

  function AppDecrease(item) {
    const index = listofDoctors.indexOf(item);
    if (listofDoctors[index].number - 1 > 0) {
      listofDoctors[index].number--;
      setRefresh(!refresh);
    }
  }

  return (
   <ImageBackground
     source={{ uri: 'https://cdn.pixabay.com/photo/2018/11/02/14/52/nurse-3790361_1280.jpg' }}
  style={styles.container}
  resizeMode="cover"

   >
      <Text style={styles.heading}>Doctor Appointments</Text>
      <Pressable onPress={() => navigation.navigate("Admin")}>
        <Text style={{ color: 'blue', marginBottom: 20}}>Go to Admin</Text>
      </Pressable>
      <Pressable onPress={()=>navigation.navigate("History")}>
        <Text style={{ color: 'blue', marginBottom: 20 }}>Show Histroy</Text>
      </Pressable>
       <Pressable onPress={()=>navigation.navigate("Cancellation")}>
        <Text style={{ color: 'blue', marginBottom: 20 }}>CancelAppointment</Text>
      </Pressable>

 
  
      <FlatList
        data={listofDoctors}
        keyExtractor={(item, index) => (item.Docname || index).toString()}
        renderItem={({ item, index }) => {
          const appointment = listofAppointments[index];
          return (
            <View style={{ padding: 10, borderBottomWidth: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: "center" }}>
                <Image
                  source={{ uri: item.profilKépUrl }}
                  style={{ width: 80, height: 120, borderRadius: 12, borderColor: 'lime', borderWidth: 2 }}
                />
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                  <Text style={{ fontWeight: "bold",color:'white' }}>{item.Docname}</Text>
                  <Text style={{ fontWeight: "bold",color:'white' }}>Description:</Text>
                  <Text style={{ fontWeight: "bold",color:'white' }}>{item.description}</Text>
                  <Text style={{ fontWeight: "bold", fontVariant: ['small-caps'],color:'white' }}>Speciality:</Text>
                  <Text style={{ fontWeight: "bold",color:'white' }}>{item.specialty}</Text>
                  <Text style={{ fontWeight: "bold",color:'white' }}>Treatment:</Text>
                  <Text style={{ fontWeight: "bold",color:'white' }}>{item.treatments}</Text>
                </View>
              </View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 15, marginTop: 40, fontWeight: 'bold', paddingVertical: 10, color:'white' }}>Patient Registration</Text>
                  <TextInput
                    placeholder='Name'
                    style={styles.input}
                    value={appointment.name}
                    onChangeText={(text) => {
                      const updated = [...listofAppointments];
                      updated[index].name = text;
                      SetlistofAppointments(updated);
                    }}
                  />
                  <TextInput
                    placeholder='Username'
                    style={styles.input}
                    value={appointment.username}
                    onChangeText={(text) => {
                      const updated = [...listofAppointments];
                      updated[index].username = text;
                      SetlistofAppointments(updated);
                    }}
                  />
                  <TextInput
                    placeholder='Email'
                    value={appointment.email}
                    style={styles.input}
                    onChangeText={(text) => {
                      const updated = [...listofAppointments];
                      updated[index].email = text;
                      SetlistofAppointments(updated);
                    }}
                  />
                  <TextInput
                    value={appointment.date.toISOString().slice(0, 10)}
                    onChangeText={(text) => {
                      const updated = [...listofAppointments];
                      updated[index].date = new Date(text);
                      SetlistofAppointments(updated);
                    }}
                    style={styles.input}
                  />
                </View>
                <View style={{ alignItems: 'flex-end', flex: 1 }}>
                  <Text style={{ textAlign: 'center', fontWeight: 'bold', marginTop: 20, paddingVertical: 10, color:'white' }}>Consultation Time</Text>
                  <Picker
                    selectedValue={appointment.timeslot}
                    onValueChange={(value) => {
                      const updated = [...listofAppointments]
                      updated[index].timeslot = value
                      SetlistofAppointments(updated)
                    }}
                  >
                    {Generate_TimeSlot().map((slot, i) => (
                      <Picker.Item key={i} label={slot} value={slot} />
                    ))}
                  </Picker>
                  <Pressable onPress={() => Confirm_Registration(index, item)}>
                   <Text style={styles.button}>Confirm Registration</Text>
                   </Pressable>

                  <Text style={{ marginTop: 20, textAlign: 'center',color:'white' }}>Number of patient</Text>
                  <Pressable onPress={() => AppIncrease(item)}>
                    <Text style={{ fontSize: 25, borderColor: 'gray', borderWidth: 4, borderRadius: 15, padding: 10, marginTop: 12, color:'white' }}>+</Text>
                  </Pressable>
                  <Text style={{ marginHorizontal: 10 }}>{item.number}</Text>
                  <Pressable onPress={() => AppDecrease(item)}>
                    <Text style={{ fontSize: 25, borderColor: 'gray', borderWidth: 4, borderRadius: 15, padding: 10, marginTop: 12,color:'white' }}>-</Text>
                  </Pressable>
                </View>
              </View>
            </View>
          );
        }}
      />
    
</ImageBackground>
  );
}
function Cancel_Appointment({ navigation }) {
  const [historyappointments, setHistoryAppointments] = useState([]);

  useEffect(() => {
    async function loadHistory() {
      const raw = await AsyncStorage.getItem("appointments");
      if (raw) setHistoryAppointments(JSON.parse(raw));
    }
    loadHistory();
  }, [])

  async function cancelAppointment(index) {
    try {
      const updated = [...historyappointments];
      updated[index].Status_Condition = "cancelled";
      setHistoryAppointments(updated);
      await AsyncStorage.setItem("appointments", JSON.stringify(updated));
      alert("Appointment cancelled");
    } catch (error) {
      console.log("Error cancelling appointment", error);
    }
  }

  return (
    <View style={{ flex: 1}}>
      <Text style={{ fontWeight: 'bold', marginBottom: 20 }}>Cancel Appointment</Text>
      {historyappointments.length > 0 ? (
        historyappointments.map((item, index) => (
          <View key={index} style={{ marginBottom: 10, alignItems: 'center' }}>
            <Text>Doctor: {item.doctor}</Text>
            <Text>Patient: {item.name}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <Text>Status: {item.Status_Condition || "booked"}</Text>
            <Pressable onPress={() => cancelAppointment(index)}>
              <Text style={{
                borderColor: 'red',
                color: 'red',
                padding: 10,
                borderWidth: 2,
                marginTop: 5
              }}>Cancel</Text>
            </Pressable>
          </View>
        ))
      ) : (
        <Text>No appointments to cancel</Text>
      )}
    </View>
  );
}

function AdminScreen() {
  const [listofAppointments, SetlistofAppointments] = useState([]);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loggedin, setloggedin] = useState(false);

  async function Load_appointments() {
    const raw = await AsyncStorage.getItem("appointments");
    if (raw) {
      SetlistofAppointments(JSON.parse(raw));
    }
  }

  async function Delete_Appointments(index) {
    const copy = [...listofAppointments];
    copy.splice(index, 1);
    await AsyncStorage.setItem("appointments", JSON.stringify(copy));
    SetlistofAppointments(copy);
  }

  function HandleLogin() {
    if (email == "admin@admin.com" && password == "admin123qwe") {
      setloggedin(true);
      Load_appointments();
    } else {
      alert("Invalid credentials");
    }
  }

  return (
    <ImageBackground 
     source={{ uri: '	https://cdn.pixabay.com/photo/2017/02/16/19/47/bokeh-2072271_1280.jpg' }}
        style={{
 
          width: 300,         
    height: 400,        
    alignSelf: 'center', 
    marginTop: 50,      
  }}

      resizeMode="cover"
      
    >
      {!loggedin ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <TextInput
            placeholder='Admin Email'
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder='Password'
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
          />
          <Pressable onPress={HandleLogin}>
            <Text style={styles.button}>Login</Text>
          </Pressable>
          <Text style={{ textAlign: "center", borderWidth: 4, borderColor: 'blue', marginTop: 25, padding: 10 }}>
            FYI Admin email is admin@admin.com & Password admin123qwe
          </Text>
        </View>
      ) : (
        <View style={{ flex: 1, paddingTop: 40 }}>
          {listofAppointments.map((app, index) => (
            <View key={index} style={{ marginTop: 10 }}>
              <Text>Doctor: {app.doctor}</Text>
              <Text>Patient: {app.name}</Text>
              <Text>Email: {app.email}</Text>
              <Text>Date: {new Date(app.date).toLocaleDateString()}</Text>
              <Text>{app.timeslot}</Text>
              <Pressable onPress={() => Delete_Appointments(index)}>
                <Text style={{ borderColor: 'red', color: 'red', padding: 10, borderWidth: 4, width:80, marginTop:20 }}>Delete</Text>
              </Pressable>
            </View>
          ))}
        </View>
      )}
    </ImageBackground>
  );
}


function Histroy_Screen() {
  const [historyappointments, sethistroyappointments] = useState([]);
  const [loading, setloading] = useState(true);

  useEffect(() => {
    async function Loadin_Histroy() {
      const raw = await AsyncStorage.getItem("appointments");
      if (raw) {
        sethistroyappointments(JSON.parse(raw));
      }
      setloading(false);
    }
    Loadin_Histroy();
  }, []);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={{ padding: 20 }}>
      {historyappointments.length > 0 ? (
        historyappointments.map((item, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text>Doctor: {item.doctor}</Text>
            <Text>Name: {item.name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <Text>Time: {item.timeslot}</Text>
          </View>
        ))
      ) : (
        <Text>No past appointments found.</Text>
      )}
    </View>
  );
}


export default function App() {
  return (
    <NavigationContainer >
      <Stack.Navigator initialRouteName="Doctor">
        <Stack.Screen name="Doctor" component={DoctorScreen} />
        <Stack.Screen name="Admin"  component={AdminScreen} />
        <Stack.Screen name="History" component={Histroy_Screen} />
        <Stack.Screen name="Cancellation" component={Cancel_Appointment} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  //  backgroundColor: '#e0f7fa',
    paddingTop: 40,
    paddingHorizontal: 10
  },
heading: {
  fontSize: 20,
  fontWeight: "bold",

  textAlign: "center", 
  color: 'white',
  borderColor: 'gray',
  borderWidth: 2,
  padding: 15,
  alignSelf: 'center',
  // width: '80%', 
 
},
  input: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
    width: 160,
    backgroundColor: '#f4f4f4',
    textAlign: 'center'
  },
  button: {
    color: 'blue',
    borderColor: 'blue',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
    width: 160
  },
  imageBackground: {
  flex: 1,
  paddingTop: 40,
  paddingHorizontal: 10,
  marginTop:30
}
});
