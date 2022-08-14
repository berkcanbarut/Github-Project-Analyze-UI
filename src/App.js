import './App.css';
import React, { useState } from 'react';
import Cookies from 'universal-cookie';

class App extends React.Component {
  constructor(props) {
    super(props);
    this.githubLoginUri = "https://github.com/login/oauth/authorize?client_id=ca33aace51a4cfc14d69";
    this.state = { login: false, authRequest: false, user: null, token: null, detailProject: { success: false, message: "" }, analyzeProject: { success: false, message: "The project is being analyzed..." }, projectList: null, isLoading: false }
    this.cookie = new Cookies();
  }
  loginButton = (e) => {
    e.preventDefault();
  }

  componentDidMount() {
    const url = window.location.href;
    const hasCode = url.includes("?code=");
    if (hasCode) {
      const githubCode = url.split("?code=")[1];
      const apiUrl = `http://localhost:4000/access/github?code=${githubCode}`;
      window.history.pushState({}, null, url.split("?code=")[0]);
      this.setState({ isLoading: true });
      fetch(apiUrl, { method: "GET", credentials: "include" })
        .then(respone => respone.json())
        .then(data => {
          const { token } = data;
          this.cookie.set("ct_token", token, { httpOnly: true, path: "/" })
          this.setState((state, props) => ({
            user: data.user, projectList: data.projects, login: true, isLoading: false,
          }))
        })
        .catch(err => console.log(err));
    }
  }

  projectAnalyze = (e) => {
    e.preventDefault();
    this.setState((state, props) => ({
      analyzeProject: { success: false, message: "The project is being analyzed..." }
    }));
    const projectDiv = e.target.parentElement.parentElement;
    const projectId = projectDiv.children[0].children[1].textContent;
    const apiUrl = `http://localhost:4000/analyze?key=${projectId}`;
    fetch(apiUrl, { method: "GET", credentials: "include" })
      .then(response => {
        return response.json();
      })
      .then(data => {
        console.log(data);
        this.setState((state, props) => ({
          analyzeProject: data
        }));
      })
      .catch(err => console.log(err));
  }

  projectDetails = (e) => {
    e.preventDefault();
    const projectDiv = e.target.parentElement.parentElement;
    const projectId = projectDiv.children[0].children[1].textContent;
    const apiUrl = `http://localhost:4000/project?id=${projectId}`
    fetch(apiUrl, { method: "GET", credentials: "include" })
      .then(response => {
        if (response.status == 401) {
          this.setState((state, props) => ({
            user: null, projectList: null, login: false, isLoading: false,
          }));
        };
        return response.json();
      })
      .then(data => {
        this.setState((state, props) => ({
          detailProject: data
        }));
      })
      .catch(err => console.log(err));
  }
  signInPage = () => {
    return (
      <div className='main-page'>
        <a href={this.githubLoginUri} className='login-btn'> <i className="fa-brands fa-github"></i> Sign in with Github</a>
      </div>
    )
  }

  userPage = () => {
    return (
      <div>
        <div className='row m-0'>
          <div className='col-md-6 user-info'>
            <h4>Welcome {this.state.user.userName}</h4>
            <div className="col-md-4 col-sm-8 col-12">
              <img src={this.state.user.avatarUrl} alt="avatars" className="img-fluid avatar" />
            </div>
            <div className="info-details">
              <h6>ID : {this.state.user.id}</h6>
              <h6>User : {this.state.user.userName}</h6>
              <h6>Email : {this.state.user.email ? this.state.user.email : "No Email Information"}</h6>
              <h6>Bio : {this.state.user.bio}</h6>
            </div>
          </div>
          <div className='col-md-6 row project-list'>
            {this.state.projectList.map(project => {
              const repoUri = `https://github.com/${this.state.user.userName}/${project.name}`
              return (
                <div className="row project" key={project.id}>
                  <div className="col-3">
                    <h5 className="text-decoration-underline">ID</h5>
                    <span>{project.id}</span>
                  </div>
                  <div className="col-5">
                    <h5 className="text-decoration-underline">PROJECT NAME</h5>
                    <a href={repoUri}>{project.name}</a>
                  </div>
                  <div className="col-4 project-btn">
                    <button onClick={this.projectDetails} className="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#detailModal">Details</button>
                    <button onClick={this.projectAnalyze} className="btn btn-dark btn-sm" data-bs-toggle="modal" data-bs-target="#analyzeModal">Analyze</button>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
        {this.analyzeModal(this.state.analyzeProject)}
        {this.detailModal(this.state.detailProject)}
      </div>
    )
  }

  analyzeModal = (project) => {
    return (
      <div className="modal fade" id="analyzeModal" tabIndex="-1" aria-labelledby="analyzeModal" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Project Analyze</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
            {project.success ?
                (
                  <ul className="list-group">
                    <li className="list-group-item list-group-item-light"><b>Project ID :</b> {project.data.id}</li>
                    <li className="list-group-item list-group-item-light"><b>Project Name :</b> {project.data.name}</li>
                    <li className="list-group-item list-group-item-light"><b>Size :</b> {project.data.size}</li>
                    <li className="list-group-item list-group-item-light"><b>Owner ID :</b> {project.data.owner}</li>
                    <li className="list-group-item list-group-item-light"><b>Duration :</b> {project.data.duration}</li>
                    {project.data.platforms.map(platform => {
                      return (
                        <li className="list-group-item list-group-item-light"><b>Platform Analyze | {platform.platformName} :</b> {platform.count}</li>
                      )
                      }
                    )}
                  </ul>
                )
                :
                (
                  <h5>{project.message}</h5>
                )
              }
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  detailModal = (project) => {
    return (
      <div className="modal fade" id="detailModal" tabIndex="-1" aria-labelledby="detailModal" aria-hidden="true">
        <div className="modal-dialog">
          <div className="modal-content">
            <div className="modal-header">
              <h5 className="modal-title" id="exampleModalLabel">Project Details</h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>
            <div className="modal-body">
              {project.success ?
                (
                  <ul className="list-group">
                    <li className="list-group-item list-group-item-light"><b>Project ID :</b> {project.data.id}</li>
                    <li className="list-group-item list-group-item-light"><b>Project Name :</b> {project.data.name}</li>
                    <li className="list-group-item list-group-item-light"><b>Size :</b> {project.data.size}</li>
                    <li className="list-group-item list-group-item-light"><b>Owner ID :</b> {project.data.owner}</li>
                    {project.data.platforms == null ?
                      <ul className="list-group mt-2">
                        <li className="list-group-item list-group-item-light"><b>Project Not Analyzed</b></li>
                      </ul>
                      :
                      <ul className="list-group mt-2">
                        <li className="list-group-item list-group-item-light"><b>Duration:</b> {project.data.duration}</li>
                        {project.data.platforms.map(platform => {
                          return (
                            <li className="list-group-item list-group-item-light"><b>Platform Analyze | {platform.platformName} :</b> {platform.count}</li>
                          )
                        }
                        )}
                      </ul>
                    }
                  </ul>
                )
                :
                (
                  <h5>{project.message}</h5>
                )
              }

            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-secondary" data-bs-dismiss="modal">Close</button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  loadingPage = () => {
    return (
      <div className="spinner-container">
        <div className="loading-spinner">
        </div>
      </div>
    )
  }

  render() {
    return (
      <div className="App">
        {
          this.state.isLoading ? this.loadingPage() : !this.state.login ?
            this.signInPage() : this.userPage()
        }
      </div>
    );
  }
}

export default App;
