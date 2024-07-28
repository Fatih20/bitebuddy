import { BrowserRouter, Route, Routes } from "react-router-dom";
import HomePage from "./components/pages/home-page";
import ChatPage from "./components/pages/chat-page";
import CheckoutPage from "./components/pages/checkout-page";
import { FoodProvider } from "./lib/providers/FoodsProvider";
import { TransitionProvider } from "./lib/providers/TransitionProvider";
import withSplashScreen from "./lib/func/withSplashScreen";
import DonePage from "./components/pages/done-page";
import { BlogPageComponent } from "./components/pages/blog-page-component";

function App() {
  return (
    <>
      <BrowserRouter>
        <FoodProvider>
          <TransitionProvider>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/chat" element={<ChatPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/done" element={<DonePage />} />
              {/* <Route path='/about/stack' element={<DonePage/>}/> */}
              <Route
                path="/about/buddy"
                element={
                  <BlogPageComponent
                    title="Meet Buddy"
                    image="/images/logo-screen.jpg"
                    sections={[
                      {
                        title: "",
                        description:
                          "We understand that navigating through menus on food delivery apps can be overwhelming.",
                      },
                      {
                        title: "That’s where Buddy comes in to help!",
                        description:
                          "Buddy is your personal food assistant, here to assist you in choosing the perfect menu from a food delivery app.",
                      },
                      {
                        title: "How to Use Buddy",
                        description:
                          "Simply type in your request in the chatbox. You can also use your voice for your food search. For example: “I want a spicy vegetarian dish under Rp20,000”",
                      },
                      {
                        title: "What Buddy can do",
                        description:
                          "Buddy can analyze your preferences. Whether you’re craving something specific or need help discovering new options, Buddy is here to guide you with ease.",
                      },
                    ]}
                    withCta={true}
                  />
                }
              />
              <Route
                path="/about/team"
                element={
                  <BlogPageComponent
                    title="Meet the Team"
                    image="/images/team-cropped.jpg"
                    sections={[
                      {
                        title: "",
                        description:
                          "We are final year students from Institut Teknologi Bandung. HackJakarta is an event for us to grow and share out ideas, and our Buddy!",
                      },
                      {
                        title: "Akbar Maulana Ridho",
                        description:
                          "Akbar skillfully compiled and processed data from 85 restaurants, resulting in a comprehensive collection of >4000 different menus from Grabfood. This extensive dataset forms the foundation of our app’s functionality.",
                      },
                      {
                        title: "Alisha Listya Wardhani",
                        description:
                          "Alisha is out UI/UX Designer. She designs intuitive user experiences, appealing illustrations. Her work ensures that the app is both practical and delightful to use.",
                      },
                      {
                        title: "Fatih Nararya R. I.",
                        description:
                          "Fatih is our AI Expert. He’s responsible for builiding infrastructure and developing chained Language Learning Models (LLM) using Langchain.",
                      },
                      {
                        title: "Muhamad Aji Wibisono",
                        description:
                          "While typically our network specialist, for this project Aji took the role of front-end developer. He ensures the interface is brought to life, translating designs into functional web pages.",
                      },
                    ]}
                    withCta={false}
                  />
                }
              />
            </Routes>
          </TransitionProvider>
        </FoodProvider>
      </BrowserRouter>
    </>
  );
}

export default withSplashScreen(App);
