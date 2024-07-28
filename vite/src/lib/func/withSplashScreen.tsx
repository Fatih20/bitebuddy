import { SplashPage } from "@/components/pages/splash-page";
import { Component, ComponentType } from "react";

export interface SplashScreenState {
  loading: boolean;
  fadeOut: boolean;
}

function withSplashScreen<T>(WrappedComponent: ComponentType<T>) {
  return class extends Component<T, SplashScreenState> {
    constructor(props: T) {
      super(props);
      this.state = {
        loading: true,
        fadeOut: false,
      };
    }

    async componentDidMount() {
      try {
        // Loading prep goes here
        setTimeout(() => {
          this.setState({ fadeOut: true });
          setTimeout(() => {
            this.setState({ loading: false });
          }, 500); // Match the duration of the fade-out effect
        }, 1300);

      } catch (err) {
        console.log(err);
        this.setState({
          loading: false,
        });
      }
    }

    render() {
      const { loading, fadeOut } = this.state;

      return (
        <>
          {loading && <SplashPage className={fadeOut ? 'animate-fadeOut' : ''}/>
            || <WrappedComponent {...this.props} />
          }
        </>
      );
    }
  };
}

export default withSplashScreen