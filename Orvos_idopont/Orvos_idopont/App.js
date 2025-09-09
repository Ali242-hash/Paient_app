import { StatusBar } from 'expo-status-bar';
import {
  StyleSheet, Text, View, Image,
  FlatList, Pressable, TextInput
} from 'react-native';
import { useState, useEffect } from 'react';
import axios, { all } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import DatePicker from 'react-native-date-picker';
import { Picker } from '@react-native-picker/picker';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { ImageBackground } from 'react-native';


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

  const Generate_TimeSlot = () => {
    const slots = [];
    for (let hour = 9; hour < 17; hour++) {
      for (let min = 0; min < 60; min += 15) {
        const h = hour.toString().padStart(2, '0');
        const m = min.toString().padStart(2, '0');
        slots.push(`${h}:${m}`);
      }
    }
    return slots;
  };

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
          timeslot: doc.timesslot.length > 0 ? doc.timesslot[0].id : ""
        }))
      );
    } catch (error) {
      console.log("Error loading doctors:", error);
    }
  }

  async function Confirm_Registraiton(index, doctor) {
    const appointment = listofAppointments[index];

    if (!appointment.name || !appointment.username || !appointment.email || !appointment.date || !appointment.timeslot) {
      alert("Please fill all fields");
      return;
    }

    try {
      let all = await AsyncStorage.getItem("appointments");
      let current = all ? JSON.parse(all) : [];

      const isDuplicate = current.some(
        (a) =>
          a.name === appointment.name &&
          a.username === appointment.username &&
          a.email === appointment.email
      );

      if (isDuplicate) {
        alert("This patient is already in the system");
        return;
      }

      current.push({
        ...appointment,
        doctor: doctor.Docname,
        Status_Condition: "booked",
        date: appointment.date.toISOString()
      });

      await AsyncStorage.setItem("appointments", JSON.stringify(current));
      alert("Registration confirmed");

  
      const updatedAppointments = [...listofAppointments];
      updatedAppointments[index] = {
        name: "",
        username: "",
        email: "",
        date: new Date(),
        timeslot: doctor.timesslot.length > 0 ? doctor.timesslot[0].id : ""
      };
      SetlistofAppointments(updatedAppointments);
    } catch (error) {
      console.log("Registration failed:", error);
    }
  }



  useEffect(() => {
    if (listofDoctors.length === 0) Load();
  }, [listofDoctors]);

  return (
    <ImageBackground
      source={{ uri: 'https://cdn.pixabay.com/photo/2016/10/22/01/54/wood-1759566_1280.jpg' }}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={{
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingVertical: 15,
        backgroundColor: '#351c75',
     
      }}>

      <Pressable onPress={() => navigation.navigate("Patient")}>
          <Text style={{ color: 'lime', fontSize: 18 }}>• Patient Registration</Text>
      </Pressable>

       <Pressable onPress={() => navigation.navigate("History")}>
          <Text style={{ color: 'lime', fontSize: 18 }}>• Appointment History</Text>
        </Pressable>

       
           
        <Pressable onPress={() => navigation.navigate("Cancel")}>
          <Text style={{ color: 'lime', fontSize: 18 }}>• Cancel Appointment</Text>
        </Pressable>

        <Pressable onPress={() => navigation.navigate("Admin")}>
          <Text style={{ color: 'lime', fontSize: 18 }}>• Admin</Text>
        </Pressable>
    
    

   
      </View>

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
                  style={{ width: 100, height: 160, borderRadius: 12, borderColor: 'lime', borderWidth: 2, marginHorizontal: 10 }}
                />
                <View style={{ marginLeft: 10, flexShrink: 1 }}>
                 
                  <Text style={{ fontWeight: "bold", color: 'white',lineHeight:30, fontSize:18 }}>Orvos Nevek: {item.Docname}</Text>
                  
                  <Text style={{ fontWeight: "bold", color: 'white',lineHeight:30, fontSize:18 }}>Leírások: {item.description}</Text>
             
                  <Text style={{ fontWeight: "bold", color: 'white',lineHeight:30, fontSize:18 }}>Szakirányok: {item.specialty}</Text>
            
                  <Text style={{ fontWeight: "bold", color: 'white',lineHeight:30, fontSize:18 }}>Kezelések: {item.treatments}</Text>
                </View>
              </View>

       

            </View>
          );
        }}
      />
    </ImageBackground>
  );
}


function Patient_Registration() {
  const [appointment, setAppointment] = useState({
    name: '',
    username: '',
    email: '',
    date: new Date(),
    timeslot: '',
    number: 1
  });



  const Confirm_Registration = async () => {
    if (!appointment.name || !appointment.username || !appointment.email || !appointment.date || !appointment.timeslot) {
      alert('Please fill all fields');
      return
    }

    try {
      let all = await AsyncStorage.getItem('appointments');
      let current = all ? JSON.parse(all) : [];

      const isDuplicate = current.some(
        (a) => a.name === appointment.name && a.username === appointment.username && a.email === appointment.email
      );
      if (isDuplicate) {
        alert('This patient is already registered');
        return;
      }

      current.push({
        ...appointment,
        Status_Condition: 'booked',
        doctor: 'Not selected',
        date: appointment.date.toISOString()
      });

      await AsyncStorage.setItem('appointments', JSON.stringify(current));
      alert('Registration confirmed');

      setAppointment({
        name: '',
        username: '',
        email: '',
        date: new Date(),
        timeslot: '',
        number: 1
      });
    } catch (error) {
      console.log('Registration failed:', error);
    }
  };

  const AppIncrease = () => {
    setAppointment({ ...appointment, number: appointment.number + 1 });
  };

  const AppDecrease = () => {
    if (appointment.number > 1) {
      setAppointment({ ...appointment, number: appointment.number - 1 });
    }
  };

return (
  <View style={{ flex: 1, alignItems: 'center', paddingTop: 30 }}>


   
    <View style={{
      width: 241,
      backgroundColor: '#ccc', 
      borderColor: 'gray',     
      borderWidth: 2,
      borderRadius: 10,
      padding: 25,
      marginTop: 20
    }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Patient Registration
      </Text>

     
      <TextInput
        placeholder="Name"
        style={styles.input}
        value={appointment.name}
        onChangeText={(text) => setAppointment({ ...appointment, name: text })}
      />
      <TextInput
        placeholder="Username"
        style={styles.input}
        value={appointment.username}
        onChangeText={(text) => setAppointment({ ...appointment, username: text })}
      />
      <TextInput
        placeholder="Email"
        style={styles.input}
        value={appointment.email}
        onChangeText={(text) => setAppointment({ ...appointment, email: text })}
      />
      <TextInput
        value={appointment.date.toISOString().slice(0, 10)}
        style={styles.input}
        onChangeText={(text) => setAppointment({ ...appointment, date: new Date(text) })}
      />

      <Text style={{ fontWeight: 'bold', marginTop: 10, textAlign:'center',padding:10 }}>Consultation Time</Text>
      <Picker
        selectedValue={appointment.timeslot}
        onValueChange={(value) => setAppointment({ ...appointment, timeslot: value })}
        style={{ width: 150, backgroundColor: '#351c75', color: 'white', marginBottom: 10,alignItems:'center' }}
      >
        {Generate_TimeSlot().map((slot, i) => (
          <Picker.Item key={i} label={slot} value={slot} />
        ))}
      </Picker>

      <Pressable onPress={Confirm_Registration}>
        <Text style={styles.button}>Confirm Registration</Text>
      </Pressable>

   
      <Text style={{ marginTop: 20, textAlign: 'center' }}>Number of Patients</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 5 }}>
        <Pressable onPress={AppIncrease}>
          <Text style={{ fontSize: 25, borderColor: 'gray', borderWidth: 4, borderRadius: 15, padding: 10, color: 'white' }}>+</Text>
        </Pressable>
        <Text style={{ marginHorizontal: 20, fontSize: 20, color: 'white' }}>{appointment.number}</Text>
        <Pressable onPress={AppDecrease}>
          <Text style={{ fontSize: 25, borderColor: 'gray', borderWidth: 4, borderRadius: 15, padding: 10, color: 'white' }}>-</Text>
        </Pressable>
      </View>
    </View>
  </View>
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
  <ImageBackground 
      source={{uri:'https://cdn.pixabay.com/photo/2023/03/11/14/52/background-7844628_1280.png'}}
    resizeMode='cover'
    style={{ flex: 1, marginTop: 30 }}
  >
    {historyappointments.length > 0 ? (
      <View style={{ flex: 1, paddingTop: 10 }}>
  
          {historyappointments.map((item, index) => (
            <View
              key={index}
              style={{
                marginBottom: 10,
                alignItems: 'flex-start',
                marginHorizontal: 20,
                borderColor: 'lime',
                borderWidth: 2,
                padding: 20,
                borderRadius: 15
              }}
            >
              <Text style={{ color: 'darkred' }}>Doctor: {item.doctor}</Text>
              <Text>Patient: {item.name}</Text>
              <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
              <Text>Status: {item.Status_Condition || "cancelled"}</Text>
              <Pressable onPress={() => cancelAppointment(index)}>
                <Text style={{
                  borderColor: 'red',
                  color: 'red',
                  padding: 10,
                  borderWidth: 2,
                  marginTop: 5
                }}>
                  Cancel
                </Text>
              </Pressable>
            </View>
          ))}
    
      </View>
    ) : (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>No appointments to cancel</Text>
      </View>
    )}
  </ImageBackground>
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

if (!loggedin) {
return (
  <View style={{ flex: 1, alignItems: 'center', paddingTop: 20,backgroundColor:'#ADD8E6' }}>

 


    <View style={{
      width: 600,
      backgroundColor: '#ccc', 
      borderColor: 'gray',
      borderWidth: 2,
      borderRadius: 20,
      padding: 20,
      marginTop: 20
    }}>
      <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
        Admin Login
      </Text>

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

      <Text style={{ textAlign: "center", borderWidth: 4, borderColor: 'lime', marginTop: 25, padding: 10, color: 'black' }}>
        FYI Admin email is admin@admin.com & Password admin123qwe
      </Text>
    </View>
  </View>
);

}

return (
  <ImageBackground
    source={{ uri: 'https://cdn.pixabay.com/photo/2024/12/16/17/10/blood-9271226_1280.png' }}
    resizeMode='cover'
    style={{ flex: 1, padding: 20 }}
  >
    {listofAppointments.map((app, index) => (
   <View key={index} style={{ marginTop: 10 }}>
  <Text style={{ color: 'white' }}>Doctor: {app.doctor}</Text>
  <Text style={{ color: 'white' }}>Patient: {app.name}</Text>
  <Text style={{ color: 'white' }}>Email: {app.email}</Text>
  <Text style={{ color: 'white' }}>Date: {new Date(app.date).toLocaleDateString()}</Text>
  <Text style={{ color: 'white' }}>{app.timeslot}</Text>
  <Pressable onPress={() => Delete_Appointments(index)}>
    <Text style={{ 
      borderColor: 'red', 
      color: 'white',
      padding: 10, 
      borderWidth: 4, 
      width: 80, 
      marginTop: 20 
    }}>
      Delete
    </Text>
  </Pressable>
</View>

    ))}
  </ImageBackground>
);


}

function Histroy_Screen() {
  const [historyappointments, sethistroyappointments] = useState([]);
  const [loading, setloading] = useState(true);


async function AutoComplte_Pastappointments() {
  try {
    let all = await AsyncStorage.getItem("appointments");
    let current = all ? JSON.parse(all) : [];
    const now = new Date();

    const updated = current.map(app => {
      if (app.Status_Condition === "booked") {
        const startTime = typeof app.timeslot === "string" ? app.timeslot.split(" - ")[0] : "00:00";
        const appointmentDate = new Date(`${app.date} ${startTime}`);
        if (now > appointmentDate) {
          return { ...app, Status_Condition: "completed" };
        }
      }
      return app;
    });

    await AsyncStorage.setItem("appointments", JSON.stringify(updated));
    return updated;
  } catch (error) {
    console.log("Error fetching appointments data", error);
  }
}




useEffect(() => {
  const Fetch_Data = async () => {
  
    const raw = await AsyncStorage.getItem("appointments")
    const initial = raw ? JSON.parse(raw):[]
    sethistroyappointments(initial)
    const update_list = await AutoComplte_Pastappointments() || []
    sethistroyappointments(update_list)
    setloading(false)


  }
  Fetch_Data();
}, []);


  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ImageBackground
      source={{
        uri: "https://cdn.pixabay.com/photo/2023/03/11/14/52/background-7844628_1280.png",
      }}
      style={{
        flex: 1,
        padding: 20,
        borderColor: "lime",
        borderWidth: 3,
        borderRadius: 15,
      }}
      resizeMode="cover"
    >
      {historyappointments.length > 0 ? (
        historyappointments.map((item, index) => (
          <View key={index} style={{ marginBottom: 10 }}>
            <Text>Doctor: {item.doctor}</Text>
            <Text>Name: {item.name}</Text>
            <Text>Email: {item.email}</Text>
            <Text>Date: {new Date(item.date).toLocaleDateString()}</Text>
            <Text>Time: {item.timeslot}</Text>
            <Text>Status: {item.Status_Condition}</Text> 
          </View>
        ))
      ) : (
       <Text>No past appointments found.</Text>
      )}
    </ImageBackground>
  );
}

function Treatment_Screen() {
  const [listOfTreatments, setListOfTreatments] = useState([]);
  const [név, setNév] = useState('');
  const [editingId, seteditingId] = useState(null);

  useEffect(() => {
    async function Fetching_Treatments() {
      try {
        let all = await AsyncStorage.getItem("treatments");
        let current = all ? JSON.parse(all) : [];
        setListOfTreatments(current);
      } catch (error) {
        console.log("error fetching treatments", error);
      }
    }
    Fetching_Treatments();
  }, []);

  async function Add_Treatment() {
    if (!név.trim()) return;

    if (editingId) {
      const updated = listOfTreatments.map(t =>
        t.id === editingId ? { ...t, név } : t
      );
      setListOfTreatments(updated);
      await AsyncStorage.setItem("treatments", JSON.stringify(updated));
      seteditingId(null);
      setNév('');
      return;
    }

    const newTreatment = { id: Date.now(), név };
    const updated = [...listOfTreatments, newTreatment];
    setListOfTreatments(updated);
    setNév('');
    await AsyncStorage.setItem("treatments", JSON.stringify(updated));
  }

  async function Delete_Treatment(index) {
    const copy = [...listOfTreatments];
    copy.splice(index, 1);
    setListOfTreatments(copy);
    await AsyncStorage.setItem("treatments", JSON.stringify(copy));
  }

  return (
    <ImageBackground
      source={{ uri: "https://cdn.pixabay.com/photo/2017/09/24/10/37/blood-group-2781421_1280.jpg" }}
      resizeMode="cover"
      style={{ padding: 20 }}
    >
      <FlatList
        data={listOfTreatments}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item, index }) => (
          <View
            style={{
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginVertical: 5,
              padding: 10,
              borderWidth: 2,
              borderColor: 'lime',
              borderRadius: 10,
            }}
          >
            <Text style={{ fontSize: 18, color: 'white' }}>{item.név}</Text>

            <View style={{ flexDirection: 'row', gap: 10 }}>
              <Pressable onPress={() => {seteditingId(item.id);setNév(item.név); }}>
                <Text style={{   color: 'white',borderColor: 'white', borderWidth: 1,  padding: 5, borderRadius: 6, }}>Edit</Text>
              </Pressable>

              <Pressable onPress={() => Delete_Treatment(index)}>
                <Text style={{color: 'white',borderColor: 'white', borderWidth: 1, padding: 5,borderRadius: 6, }}> Delete</Text>
              </Pressable>
            </View>
          </View>
        )}
      />

      <TextInput
        placeholder="Treatment name"
        value={név}
        onChangeText={setNév}
        style={{
          borderWidth: 1,
          borderColor: 'white',
          borderRadius: 8,
          padding: 10,
          marginTop: 10,
          textAlign:'center',
          color: 'white',
        }}
        placeholderTextColor="lightgray"
      />

      <Pressable onPress={Add_Treatment}>
        <Text
          style={{
            color: 'white',
            borderColor: 'lime',
            borderWidth: 1,
            padding: 8,
            borderRadius: 6,
            marginTop: 10,
            textAlign: 'center',
          }}
        >
          {editingId ? 'Save change' : 'Add Treatment'}
        </Text>
      </Pressable>
    </ImageBackground>
  );
}


export default function App() {
  return (
    <NavigationContainer >
      <Stack.Navigator initialRouteName="Doctor">
        <Stack.Screen name="Doctor" component={DoctorScreen} />
        <Stack.Screen name="Admin"  component={AdminScreen} />
        <Stack.Screen name="History" component={Histroy_Screen} />
        <Stack.Screen name="Cancel" component={Cancel_Appointment} />
        <Stack.Screen name="Treatment" component={Treatment_Screen}/>
         <Stack.Screen name="Patient" component={Patient_Registration} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  //  backgroundColor: '#e0f7fa',
    paddingTop: 40,
    paddingHorizontal: 10,
    borderWidth:4,
    borderColor:'lime'
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
    textAlign: 'center',
    alignItems:"center"
  },
  button: {
    color: 'black',
    borderColor: 'gray',
    borderWidth: 1,
    padding: 8,
    borderRadius: 6,
    marginTop: 10,
    textAlign: 'center',
    width: 160,
    
  },
  imageBackground: {
  flex: 1,
  paddingTop: 40,
  paddingHorizontal: 10,
  marginTop:30
}
});